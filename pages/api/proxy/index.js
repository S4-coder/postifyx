/**
 * PostifyX relay — Next.js API route counterpart to the standalone `server/proxy.mjs`.
 *
 * Works around browser CORS on Vercel deployments: the browser cannot call
 * external APIs directly, so it posts the request envelope here. The route
 * handler forwards it server-side (where CORS does not apply) and returns the
 * upstream response in the same `HttpResponse` shape that `src/lib/tauri.js`
 * expects.
 *
 * Configuration (all optional, env vars):
 *   POSTIFYX_PROXY_ALLOW_HOSTS  comma-separated hostname allowlist; empty = allow all
 *
 * SECURITY: an open relay is an SSRF primitive. On a public Vercel deployment
 * you should set POSTIFYX_PROXY_ALLOW_HOSTS to the specific hosts your users
 * intend to reach, or put the route behind authentication.
 */

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

const validateTarget = (rawUrl) => {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return `Invalid URL: ${rawUrl}`;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return `Unsupported scheme "${url.protocol}". Only http and https are allowed.`;
  }

  const allowHosts = (process.env.POSTIFYX_PROXY_ALLOW_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  if (allowHosts.length && !allowHosts.includes(url.hostname.toLowerCase())) {
    return `Host "${url.hostname}" is not in this relay's allowlist.`;
  }

  return null;
};

export default async function handler(req, res) {
  const started = Date.now();

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    return jsonResponse(res, 405, errorShape('PostifyX relay: POST a request payload to this route.'));
  }

  const payload = req.body;
  const { url, method = 'GET', headers = {}, body, timeout_ms: timeoutMs } = payload ?? {};

  if (!url) {
    return jsonResponse(res, 400, errorShape('Relay payload is missing a url.'));
  }

  const upstreamMethod = String(method).toUpperCase();
  if (!ALLOWED_UPSTREAM_METHODS.has(upstreamMethod)) {
    return jsonResponse(res, 400, errorShape(`Relay does not allow the ${upstreamMethod} method.`));
  }

  const targetError = validateTarget(url);
  if (targetError) {
    return jsonResponse(res, 400, errorShape(targetError));
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

    return jsonResponse(res, 200, {
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
    return jsonResponse(
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
}

function jsonResponse(res, status, payload) {
  res.setHeader('Content-Type', 'application/json');
  res.status(status).json(payload);
}
