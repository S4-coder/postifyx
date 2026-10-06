/**
 * URL validation shared by every transport.
 *
 * Without a scheme, `fetch` treats the value as a path relative to the current
 * page. In this app that silently resolves against the dev server origin, so
 * `jsonplaceholder.typicode.com/posts/1` becomes
 * `http://localhost:3001/jsonplaceholder.typicode.com/posts/1` and the user sees
 * Next's "This page could not be found" instead of their response. Detecting it
 * here turns a baffling 404 into an actionable message.
 *
 * gRPC is deliberately excluded: it addresses a bare `host:port` and the
 * transport prepends the scheme itself.
 */

/** Schemes each transport is allowed to use. */
const HTTP_SCHEMES = ['http:', 'https:'];
const WS_SCHEMES = ['ws:', 'wss:', ...HTTP_SCHEMES];
const SSE_SCHEMES = HTTP_SCHEMES;

/** Schemes that a pasted value already carries, checked before parsing. */
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Returns an error message when `url` is unusable, otherwise `null`.
 *
 * @param {string} url
 * @param {{ schemes?: string[], label?: string }} [options]
 * @returns {string|null}
 */
export function describeUrlProblem(url, options = {}) {
  const { schemes = HTTP_SCHEMES, label = 'URL' } = options;
  const value = String(url ?? '').trim();

  if (!value) return `Enter a ${label.toLowerCase()} first.`;

  if (!ANY_SCHEME.test(value)) {
    return (
      `"${value}" has no scheme, so it would be sent as a path on this app's own origin. ` +
      `Prefix it with ${schemes.includes('https:') ? 'https://' : schemes[0]}.`
    );
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return `"${value}" is not a valid ${label.toLowerCase()}.`;
  }

  if (!schemes.includes(parsed.protocol)) {
    return `${label} uses "${parsed.protocol}" but this transport needs ${schemes.join(' or ')}.`;
  }

  if (!parsed.host) {
    return `"${value}" has no host.`;
  }

  return null;
}

export { HTTP_SCHEMES, WS_SCHEMES, SSE_SCHEMES };
