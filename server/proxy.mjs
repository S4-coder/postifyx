/**
 * OpenClient relay — the browser-mode counterpart to the Rust network engine.
 *
 * The desktop app talks to `execute_rest_request` over Tauri IPC, which has no
 * CORS restriction. A browser tab does, so requests made from the web build are
 * forwarded here instead.
 *
 * Run it alongside the dev server:
 *
 *   node server/proxy.mjs
 *
 * Configuration (all optional):
 *   PORT        port to listen on (default 8787)
 *   HOST        interface to bind (default 127.0.0.1)
 *   ALLOW_HOSTS comma-separated hostname allowlist; empty means allow all
 *
 * SECURITY: an open relay is a server-side request forgery primitive. The
 * default bind is loopback-only for that reason. If you expose this beyond your
 * own machine, set ALLOW_HOSTS to the specific hosts you intend to reach and
 * put the service behind authentication.
 */

import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '127.0.0.1';
const ALLOW_HOSTS = (process.env.ALLOW_HOSTS ?? '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

const MAX_BODY_BYTES = 8 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 60_000;
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ALLOWED_UPSTREAM_METHODS = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '600',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const errorShape = (error, timeMs = 0) => ({
  status: 0,
  status_text: '',
  headers: {},
  body: '',
  time_ms: timeMs,
  size_bytes: 0,
  error,
  truncated: false,
});

/**
 * Validates the outgoing target. Returns null when acceptable, otherwise a
 * message explaining the rejection.
 */
function validateTarget(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return `Invalid URL: ${rawUrl}`;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return `Unsupported scheme "${url.protocol}". Only http and https are allowed.`;
  }

  if (ALLOW_HOSTS.length && !ALLOW_HOSTS.includes(url.hostname.toLowerCase())) {
    return `Host "${url.hostname}" is not in this relay's ALLOW_HOSTS list.`;
  }

  return null;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Relay request body exceeded 8 MB.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(new Error(`Relay received malformed JSON: ${err.message}`));
      }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  if (req.method !== 'POST' || !req.url?.startsWith('/')) {
    sendJson(res, 404, errorShape('OpenClient relay: POST a request payload to this origin.'));
    return;
  }

  const started = Date.now();
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (err) {
    sendJson(res, 400, errorShape(err.message));
    return;
  }

  const { url, method = 'GET', headers = {}, body, timeout_ms: timeoutMs } = payload ?? {};

  if (!url) {
    sendJson(res, 400, errorShape('Relay payload is missing a url.'));
    return;
  }

  const upstreamMethod = String(method).toUpperCase();
  if (!ALLOWED_UPSTREAM_METHODS.has(upstreamMethod)) {
    sendJson(res, 400, errorShape(`Relay does not allow the ${upstreamMethod} method.`));
    return;
  }

  const targetError = validateTarget(url);
  if (targetError) {
    sendJson(res, 400, errorShape(targetError));
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Math.min(Number(timeoutMs) > 0 ? Number(timeoutMs) : REQUEST_TIMEOUT_MS, REQUEST_TIMEOUT_MS),
  );

  try {
    const response = await fetch(url, {
      method: upstreamMethod,
      headers,
      body: BODY_METHODS.has(upstreamMethod) && body ? body : undefined,
      redirect: 'follow',
      signal: controller.signal,
    });

    const text = await response.text();
    const truncated = Buffer.byteLength(text) > MAX_BODY_BYTES;
    const clamped = truncated ? Buffer.from(text).subarray(0, MAX_BODY_BYTES).toString('utf8') : text;

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    sendJson(res, 200, {
      status: response.status,
      status_text: response.statusText ?? '',
      headers: responseHeaders,
      body: clamped,
      time_ms: Date.now() - started,
      size_bytes: Number(responseHeaders['content-length'] ?? clamped.length),
      error: null,
      truncated,
    });
  } catch (err) {
    const aborted = err?.name === 'AbortError';
    sendJson(
      res,
      200,
      errorShape(
        aborted ? 'Upstream request timed out.' : `Relay could not reach the host: ${err.message}`,
        Date.now() - started,
      ),
    );
  } finally {
    clearTimeout(timer);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`OpenClient relay listening on http://${HOST}:${PORT}`);
  console.log(
    ALLOW_HOSTS.length
      ? `Allowlist active: ${ALLOW_HOSTS.join(', ')}`
      : 'Warning: no ALLOW_HOSTS set. This relay will forward to any host.',
  );
});
