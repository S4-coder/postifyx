/**
 * Shareable request links.
 *
 * The whole request is packed into the URL fragment, never the query string.
 * Fragments are not sent to a server, so a shared link cannot leak the request
 * into an access log, a referrer header, or a proxy. That is the property that
 * makes this safe for a payload that may contain a token.
 *
 * Secrets are redacted before encoding for the same reason: a link is the one
 * artefact here that leaves the machine.
 */

const SECRET_HEADERS = new Set(['authorization', 'x-api-key', 'api-key', 'proxy-authorization']);

const toBase64Url = (text) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (value) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '==='.slice((padded.length + 3) % 4));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const redact = (headers) =>
  Object.fromEntries(
    Object.entries(headers ?? {}).map(([key, value]) => [
      key,
      SECRET_HEADERS.has(key.toLowerCase()) ? 'YOUR_TOKEN' : value,
    ]),
  );

/**
 * Builds a link that reopens this request.
 *
 * @param {{url: string, method: string, headers: Record<string,string>, body?: string, bodyFormat?: string}} request
 * @returns {string} absolute URL
 */
export function buildShareUrl(request) {
  const payload = toBase64Url(
    JSON.stringify({
      u: request.url,
      m: request.method,
      h: redact(request.headers),
      b: request.body ?? '',
      f: request.bodyFormat,
    }),
  );

  const { origin, pathname } = window.location;
  return `${origin}${pathname}#r=${payload}`;
}

/**
 * Reads a shared request out of the location hash and clears it, so a refresh
 * does not re-apply a request the user has since edited.
 *
 * @returns {object|null} staged request, or null when the hash is absent
 */
export function takeSharedRequest() {
  const hash = window.location.hash;
  if (!hash.startsWith('#r=')) return null;

  const payload = hash.slice(3);
  // Remove the fragment first: if decoding throws, the URL is still clean.
  history.replaceState(null, '', window.location.pathname + window.location.search);

  try {
    const decoded = JSON.parse(fromBase64Url(payload));
    if (!decoded?.u) return null;
    return {
      url: decoded.u,
      method: decoded.m ?? 'GET',
      headers: decoded.h ?? {},
      body: decoded.b ?? '',
      bodyFormat: decoded.f,
    };
  } catch {
    return null;
  }
}
