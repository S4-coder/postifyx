/**
 * Typed desktop bridge.
 *
 * Desktop builds talk to Rust over Tauri IPC, which means requests originate
 * from native sockets and are completely unaffected by browser CORS.
 *
 * In a browser tab the same request has to hop through a relay, because the
 * webview's own fetch() is still bound by CORS. Two paths are tried in order:
 *
 *   1. Direct fetch — fastest, and works for any host that sends
 *      `Access-Control-Allow-Origin`. Covers GitHub, Hacker News, dog.ceo,
 *      httpbin and similar.
 *   2. Relay (`server/proxy.mjs`) — used when the direct attempt is blocked.
 *
 * Every path resolves with the same `HttpResponse` shape. Transport failures
 * come back as `{ status: 0, error }` rather than rejecting, so the response
 * inspector can render them inline.
 */

import { describeUrlProblem, HTTP_SCHEMES } from '@/lib/urlCheck';

let invokeFn = null;

/**
 * `@tauri-apps/api/core` is dynamically imported so it stays out of the
 * browser bundle's critical path and cannot hard-fail a web-only install.
 */
async function getInvoke() {
  if (invokeFn) return invokeFn;
  const mod = await import('@tauri-apps/api/core');
  invokeFn = mod.invoke;
  return invokeFn;
}

/** True when running inside the Tauri webview. */
export function isDesktop() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Where the relay lives, or `null` when no relay is reachable.
 *
 * The standalone relay (`server/proxy.mjs` on port 8787) is used when the page
 * itself is served from localhost. On a Vercel deployment a standalone relay is
 * never running, but a Next.js App Router API route at `/api/proxy` is
 * available instead — the browser cannot call external APIs directly due to
 * CORS, so forward through that route which runs server-side.
 */
export function getProxyEndpoint() {
  const configured =
    process.env.NEXT_PUBLIC_PostifyX_PROXY ??
    (typeof window !== 'undefined' ? window.localStorage?.getItem('PostifyX.proxy') : null);

  if (configured) return String(configured).replace(/\/$/, '');

  if (typeof window === 'undefined') return null;

  const { hostname, port, protocol } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:8787`;
  }

  // On a Vercel deployment a standalone relay is never running, but a Next.js
  // API route is available. The browser cannot call external APIs directly due
  // to CORS, so forward through `/api/proxy` which runs server-side.
  return '/api/proxy';
}

/** Persists a relay override so a hosted deployment can point at its own. */
export function setProxyEndpoint(url) {
  try {
    if (url) window.localStorage.setItem('PostifyX.proxy', url);
    else window.localStorage.removeItem('PostifyX.proxy');
  } catch {
    /* storage unavailable: fall back to the default endpoint */
  }
}

/** True when the current page is served from a remote (non-local) origin. */
function isRemoteOrigin() {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return hostname !== 'localhost' && hostname !== '127.0.0.1';
}

/**
 * True when a target URL points at the current machine (localhost, 127.0.0.1,
 * or a private/loopback range). Calling such a URL from a remotely-hosted tab
 * is impossible: the browser blocks it via CORS and the server-side relay
 * runs on the server, not on the user's machine.
 */
function isLocalTarget(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.')
    );
  } catch {
    return false;
  }
}

const emptyResponse = (error, timeMs = 0) => ({
  status: 0,
  status_text: '',
  headers: {},
  body: '',
  time_ms: timeMs,
  size_bytes: 0,
  error,
  truncated: false,
});

const isAbort = (err) => err?.name === 'AbortError';

/** Normalises a `Response` into the PostifyX response shape. */
async function toHttpResponse(res, started) {
  const body = await res.text();
  const headers = {};
  res.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    status: res.status,
    status_text: res.statusText ?? '',
    headers,
    body,
    time_ms: Date.now() - started,
    size_bytes: Number(headers['content-length'] ?? body.length),
    error: null,
    truncated: false,
  };
}

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * @typedef {Object} HttpRequest
 * @property {string} url
 * @property {string} [method]
 * @property {Record<string,string>} [headers]
 * @property {string} [body]
 * @property {number} [timeout_ms]
 */

/**
 * @typedef {Object} HttpResponse
 * @property {number} status
 * @property {string} status_text
 * @property {Record<string,string>} headers
 * @property {string} body
 * @property {number} time_ms
 * @property {number} size_bytes
 * @property {string|null} error
 * @property {boolean} truncated
 */

/**
 * Desktop path: hand the request straight to the Rust engine.
 *
 * @param {HttpRequest} req
 * @returns {Promise<HttpResponse>}
 */
async function sendViaDesktop(req) {
  const started = Date.now();
  try {
    const invoke = await getInvoke();
    return await invoke('execute_rest_request', { request: req });
  } catch (err) {
    return emptyResponse(`Desktop engine error: ${String(err)}`, Date.now() - started);
  }
}

/**
 * Direct browser fetch. Rejects on CORS failure, which is the signal to fall
 * back to the relay.
 */
async function sendDirect(req, timeoutMs) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(req.url, {
      method: req.method ?? 'GET',
      headers: req.headers,
      body: METHODS_WITH_BODY.has((req.method ?? 'GET').toUpperCase()) ? req.body : undefined,
      redirect: 'follow',
      signal: controller.signal,
    });
    return await toHttpResponse(res, started);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Relay path: the request is wrapped in a JSON envelope and forwarded to
 * the relay endpoint returned by `getProxyEndpoint()`, which performs it
 * server-side where CORS does not apply.
 */
async function sendViaProxy(req, timeoutMs) {
  const endpoint = getProxyEndpoint();

  if (!endpoint) {
    return emptyResponse(
      'Blocked by CORS and no relay is configured. Run `node server/proxy.mjs` and reload, ' +
        'or set window.localStorage["PostifyX.proxy"] to a relay URL. ' +
        'The desktop app has no CORS restriction at all.',
    );
  }

  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(getProxyEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    // The relay answers non-2xx for its own rejections (bad method, malformed
    // URL, host not allowlisted) and puts the real reason in the JSON body.
    // Surfacing that beats a generic "is the relay running?" message, which
    // sends people looking in the wrong place when the relay is healthy.
    if (!res.ok) {
      const detail = await res
        .json()
        .then((p) => p?.error)
        .catch(() => null);

      return emptyResponse(
        detail
          ? `Relay rejected the request: ${detail}`
          : `Relay at ${endpoint} returned ${res.status}.`,
        Date.now() - started,
      );
    }

    const payload = await res.json();
    return {
      status: payload.status ?? 0,
      status_text: payload.status_text ?? '',
      headers: payload.headers ?? {},
      body: payload.body ?? '',
      time_ms: payload.time_ms ?? Date.now() - started,
      size_bytes: payload.size_bytes ?? 0,
      error: payload.error ?? null,
      truncated: payload.truncated ?? false,
    };
  } catch (err) {
    return emptyResponse(
      isAbort(err)
        ? `Request timed out after ${Math.round(timeoutMs / 1000)}s.`
        : `Relay at ${endpoint} is unreachable. Start it with: node server/proxy.mjs (${String(err)})`,
      Date.now() - started,
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Executes an HTTP request. Always resolves with a response object.
 *
 * @param {HttpRequest} req
 * @returns {Promise<HttpResponse>}
 */
export async function sendRequest(req) {
  // Catches a pasted URL that has no scheme, which would otherwise be fetched
  // as a path on this app's own origin and surface as a 404 from the dev server.
  const problem = describeUrlProblem(req?.url, { schemes: HTTP_SCHEMES, label: 'Request URL' });
  if (problem) return emptyResponse(problem);

  if (isDesktop()) return sendViaDesktop(req);

  // When the app itself is hosted on a remote origin (e.g. Vercel) and the
  // user targets a localhost/private address, neither a direct browser fetch
  // nor a server-side relay can reach it. Detect this up front and show an
  // actionable message instead of a generic CORS error.
  if (isRemoteOrigin() && isLocalTarget(req.url)) {
    return emptyResponse(
      `Cannot reach ${new URL(req.url).hostname} from this page because it is hosted on a remote server ` +
        '(e.g. Vercel). The browser blocks the direct fetch, and the server-side relay ' +
        'runs on the server — not on your machine. ' +
        'Choose one: (1) use the PostifyX desktop app, which has native sockets and no CORS; ' +
        '(2) expose your local API with ngrok or localtunnel and call the public URL; ' +
        'or (3) run `npm run dev:full` to use the app from localhost.',
    );
  }

  const timeoutMs = req.timeout_ms > 0 ? req.timeout_ms : 60_000;

  try {
    return await sendDirect(req, timeoutMs);
  } catch (directError) {
    if (isAbort(directError)) {
      return emptyResponse(`Request timed out after ${Math.round(timeoutMs / 1000)}s.`);
    }

    // Almost always a CORS rejection. The relay exists exactly for this case.
    const viaProxy = await sendViaProxy(req, timeoutMs);
    if (viaProxy.error) {
      viaProxy.error = `${viaProxy.error} (direct request was blocked by CORS: ${String(directError)})`;
    }
    return viaProxy;
  }
}

/**
 * Desktop build metadata. Falls back to static values in browser mode so
 * callers never need a null check.
 */
export async function getAppInfo() {
  const fallback = {
    name: 'PostifyX',
    version: '0.1.0',
    userAgent: 'PostifyX/0.1.0',
    maxBodyBytes: 8 * 1024 * 1024,
    timeoutSeconds: 60,
    transport: isDesktop() ? 'rust-native' : 'browser-relay',
  };

  if (!isDesktop()) return fallback;

  try {
    const invoke = await getInvoke();
    return { ...fallback, ...(await invoke('app_info')) };
  } catch {
    return fallback;
  }
}
