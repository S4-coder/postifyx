/**
 * Demo stream endpoints for PostifyX's WebSocket and SSE transports.
 *
 * The public test services for these protocols are frequently rate-limited or
 * offline, which makes it impossible to tell whether a failure is in PostifyX
 * or in the remote service. This server provides deterministic local targets so
 * the transports can be verified on demand.
 *
 *   node server/demo-streams.mjs
 *
 * Endpoints:
 *   ws://localhost:8788/ws     echo server — every frame sent is echoed back
 *   http://localhost:8788/sse  server-sent events, one event per second
 *
 * This is a development aid, not part of the shipped app.
 */

import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';

const PORT = Number(process.env.STREAMS_PORT ?? 8788);
const HOST = process.env.STREAMS_HOST ?? '127.0.0.1';
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// ── Minimal RFC 6455 framing ────────────────────────────────────────────────
// Only what an echo server needs: text/binary frames, ping/pong and close.

const OPCODE = { TEXT: 0x1, BINARY: 0x2, CLOSE: 0x8, PING: 0x9, PONG: 0xa };

/** Encodes a single unmasked server frame. */
function encodeFrame(opcode, payload) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload));
  const length = data.length;

  let header;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  header[0] = 0x80 | opcode; // FIN + opcode

  return Buffer.concat([header, data]);
}

/**
 * Extracts every complete frame from `buffer`, returning the frames and the
 * unconsumed remainder. Client frames are always masked, so payloads are
 * unmasked here.
 */
function decodeFrames(buffer) {
  const frames = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const opcode = buffer[offset] & 0x0f;
    const masked = (buffer[offset + 1] & 0x80) !== 0;
    let length = buffer[offset + 1] & 0x7f;
    let cursor = offset + 2;

    if (length === 126) {
      if (cursor + 2 > buffer.length) break;
      length = buffer.readUInt16BE(cursor);
      cursor += 2;
    } else if (length === 127) {
      if (cursor + 8 > buffer.length) break;
      length = Number(buffer.readBigUInt64BE(cursor));
      cursor += 8;
    }

    let maskKey = null;
    if (masked) {
      if (cursor + 4 > buffer.length) break;
      maskKey = buffer.subarray(cursor, cursor + 4);
      cursor += 4;
    }

    if (cursor + length > buffer.length) break; // frame not yet complete

    const payload = Buffer.from(buffer.subarray(cursor, cursor + length));
    if (maskKey) {
      for (let i = 0; i < payload.length; i += 1) {
        payload[i] ^= maskKey[i % 4];
      }
    }

    frames.push({ opcode, payload });
    offset = cursor + length;
  }

  return { frames, rest: buffer.subarray(offset) };
}

// ── Server ──────────────────────────────────────────────────────────────────

const sockets = new Set();
const sseClients = new Set();

const server = createServer((req, res) => {
  if (req.url?.startsWith('/sse')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write('retry: 3000\n\n');

    const client = { id: randomUUID(), res, count: 0 };
    sseClients.add(client);

    const tick = setInterval(() => {
      client.count += 1;
      const payload = JSON.stringify({
        sequence: client.count,
        timestamp: new Date().toISOString(),
        message: `Tick ${client.count}`,
      });
      res.write(`id: ${client.count}\nevent: tick\ndata: ${payload}\n\n`);
    }, 1000);

    const cleanup = () => {
      clearInterval(tick);
      sseClients.delete(client);
    };

    req.on('close', cleanup);
    res.on('error', cleanup);
    return;
  }

  if (req.url?.startsWith('/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, wsClients: sockets.size, sseClients: sseClients.size }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Use /ws for WebSocket or /sse for server-sent events.');
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (req.url !== '/ws' || !key) {
    socket.destroy();
    return;
  }

  const accept = createHash('sha1').update(key + WS_GUID).digest('base64');

  socket.write(
    [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${accept}`,
      '\r\n',
    ].join('\r\n'),
  );
  socket.setNoDelay(true);
  sockets.add(socket);

  socket.write(encodeFrame(OPCODE.TEXT, 'PostifyX echo server connected'));

  let buffer = Buffer.alloc(0);

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    const { frames, rest } = decodeFrames(buffer);
    buffer = rest;

    for (const { opcode, payload } of frames) {
      if (opcode === OPCODE.TEXT || opcode === OPCODE.BINARY) {
        socket.write(encodeFrame(opcode, payload));
      } else if (opcode === OPCODE.PING) {
        socket.write(encodeFrame(OPCODE.PONG, payload));
      } else if (opcode === OPCODE.CLOSE) {
        socket.write(encodeFrame(OPCODE.CLOSE, Buffer.alloc(0)));
        socket.end();
      }
    }
  });

  const cleanup = () => sockets.delete(socket);
  socket.on('close', cleanup);
  socket.on('error', cleanup);
});

server.listen(PORT, HOST, () => {
  console.log(`PostifyX demo streams on http://${HOST}:${PORT}`);
  console.log(`  WebSocket : ws://${HOST}:${PORT}/ws`);
  console.log(`  SSE       : http://${HOST}:${PORT}/sse`);
});
