'use client';

import { isDesktop } from '@/lib/tauri';

/**
 * Streaming transports (WebSocket, SSE) and gRPC.
 *
 * Browser and desktop use different mechanisms for the same user-visible
 * feature:
 *
 * - Browser: the platform's own `WebSocket` and `EventSource` objects. These
 *   are not subject to CORS in the same way `fetch` is, but an SSE response
 *   still has to opt in via `Access-Control-Allow-Origin`.
 * - Desktop: Rust owns the socket and pushes frames into the webview as Tauri
 *   events, so no relay is involved at all.
 *
 * Both paths surface identical store state, which is what the UI renders.
 */

/** Stable connection id; lets several sockets coexist in one workspace. */
export const STREAM_ID = 'default';

let invokeFn = null;
let listenFn = null;

async function tauriCore() {
  if (!invokeFn) invokeFn = (await import('@tauri-apps/api/core')).invoke;
  return invokeFn;
}

async function tauriEvent() {
  if (!listenFn) listenFn = (await import('@tauri-apps/api/event')).listen;
  return listenFn;
}

/** Rust event name used for every stream frame. */
const RUST_STREAM_EVENT = 'openclient://stream-message';
const RUST_STREAM_STATUS = 'openclient://stream-status';

function parseFrame(raw) {
  const text = typeof raw === 'string' ? raw : String(raw);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ── WebSocket ───────────────────────────────────────────────────────────────

/**
 * Opens a WebSocket and returns a controller with a `close` method.
 *
 * @param {{url: string}} config
 * @param {(msg: {direction: 'in'|'out', payload: unknown, at: string}) => void} onMessage
 * @param {(status: string, detail?: string) => void} onStatus
 */
export async function openWebSocket({ url }, onMessage, onStatus) {
  if (isDesktop()) {
    const invoke = await tauriCore();
    const listen = await tauriEvent();

    const unlistenMessage = await listen(RUST_STREAM_EVENT, (event) => {
      const payload = event.payload;
      if (payload?.streamId !== STREAM_ID) return;
      onMessage({
        direction: payload.direction,
        payload: parseFrame(payload.data),
        at: payload.at,
      });
    });

    const unlistenStatus = await listen(RUST_STREAM_STATUS, (event) => {
      if (event.payload?.streamId !== STREAM_ID) return;
      onStatus(event.payload.status, event.payload.detail);
    });

    try {
      await invoke('ws_connect', { config: { streamId: STREAM_ID, url } });
    } catch (err) {
      unlistenMessage();
      unlistenStatus();
      onStatus('error', String(err));
      throw err;
    }

    return {
      send: (data) => invoke('ws_send', { streamId: STREAM_ID, data }),
      close: async () => {
        unlistenMessage();
        unlistenStatus();
        await invoke('ws_disconnect', { streamId: STREAM_ID });
      },
    };
  }

  // Browser path.
  return new Promise((resolve, reject) => {
    let socket;
    try {
      socket = new WebSocket(url);
    } catch (err) {
      onStatus('error', String(err));
      reject(err);
      return;
    }

    socket.onopen = () => onStatus('open');
    socket.onerror = () => onStatus('error', 'WebSocket connection failed');
    socket.onclose = (event) =>
      onStatus('closed', event.reason || `code ${event.code}`);

    socket.onmessage = (event) =>
      onMessage({
        direction: 'in',
        payload: parseFrame(event.data),
        at: new Date().toISOString(),
      });

    resolve({
      send: (data) => {
        if (socket.readyState !== WebSocket.OPEN) {
          throw new Error('Socket is not open.');
        }
        socket.send(data);
        onMessage({ direction: 'out', payload: parseFrame(data), at: new Date().toISOString() });
      },
      close: () => socket.close(),
    });
  });
}

// ── Server-Sent Events ──────────────────────────────────────────────────────

/**
 * Subscribes to an SSE stream.
 *
 * @param {{url: string, lastEventId?: string, headers?: Record<string,string>}} config
 * @param {(msg: {payload: unknown, at: string, event: string}) => void} onMessage
 * @param {(status: string, detail?: string) => void} onStatus
 */
export async function openEventStream(config, onMessage, onStatus) {
  if (isDesktop()) {
    const invoke = await tauriCore();
    const listen = await tauriEvent();

    const unlistenMessage = await listen(RUST_STREAM_EVENT, (event) => {
      const payload = event.payload;
      if (payload?.streamId !== STREAM_ID) return;
      onMessage({
        payload: parseFrame(payload.data),
        at: payload.at,
        event: payload.event ?? 'message',
      });
    });

    const unlistenStatus = await listen(RUST_STREAM_STATUS, (event) => {
      if (event.payload?.streamId !== STREAM_ID) return;
      onStatus(event.payload.status, event.payload.detail);
    });

    try {
      await invoke('sse_connect', { config: { streamId: STREAM_ID, ...config } });
    } catch (err) {
      unlistenMessage();
      unlistenStatus();
      onStatus('error', String(err));
      throw err;
    }

    return {
      close: async () => {
        unlistenMessage();
        unlistenStatus();
        await invoke('sse_disconnect', { streamId: STREAM_ID });
      },
    };
  }

  // Browser path. EventSource cannot send custom headers, so auth must ride in
  // the query string — the desktop path has no such limitation.
  const source = new EventSource(config.url, { withCredentials: false });

  const handler = (event) =>
    onMessage({
      payload: parseFrame(event.data),
      at: new Date().toISOString(),
      event: event.type,
    });

  source.onopen = () => onStatus('open');
  source.onerror = () =>
    onStatus(source.readyState === EventSource.CLOSED ? 'closed' : 'error', 'stream interrupted');
  source.addEventListener('message', handler);
  // Named events need their own listener; `message` alone would miss them.
  source.addEventListener('tick', handler);
  source.addEventListener('put', handler);

  return {
    close: () => source.close(),
  };
}

/**
 * Lists services and methods in a base64 descriptor set, so the UI can offer a
 * picker instead of making the user type fully-qualified names.
 *
 * @param {string} descriptorSet
 * @returns {Promise<Array<{name: string, methods: Array<{name: string, input: string, output: string, serverStreaming: boolean, clientStreaming: boolean}>}>>}
 */
export async function describeGrpcServices(descriptorSet) {
  if (!isDesktop()) {
    throw new Error(
      'Reading a descriptor set needs the desktop app, which is where the gRPC transport lives.',
    );
  }

  const invoke = await tauriCore();
  return invoke('grpc_describe_services', { descriptorSet });
}

// ── gRPC ────────────────────────────────────────────────────────────────────

/**
 * Performs a gRPC unary call through the Rust transport.
 *
 * Browser mode cannot speak HTTP/2 gRPC directly, so this path always requires
 * the desktop app.
 *
 * @param {{url: string, service: string, method: string, message: string, metadata?: Record<string,string>, protoJson?: object}} config
 * @returns {Promise<{status: number, grpcStatus: string, message: string, grpcMessage: string, elapsedMs: number, error: string|null}>}
 */
export async function callGrpc(config) {
  if (!isDesktop()) {
    return {
      status: 0,
      grpcStatus: 'UNAVAILABLE',
      message: 'Browser mode cannot speak HTTP/2 gRPC.',
      grpcMessage: '',
      elapsedMs: 0,
      error:
        'gRPC requires the PostifyX desktop app. Launch it from the Downloads page, ' +
        'or use REST/GraphQL/WebSocket/SSE in the browser.',
    };
  }

  const invoke = await tauriCore();
  return invoke('grpc_call', { config });
}
