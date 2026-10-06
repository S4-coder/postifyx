/**
 * Hand-off channel between the marketing pages and the workspace.
 *
 * `sessionStorage` is the right scope for this: it survives the route change
 * that follows "Run in App", dies with the tab, and never leaks into the
 * persisted Zustand store. Keeping it in a lib module also stops the workspace
 * from importing a page module, which would pull the whole directory UI into
 * the workspace bundle.
 */

export const PENDING_REQUEST_KEY = 'PostifyX.pendingRequest';

/**
 * Stages a request for the workspace to pick up on mount.
 *
 * @param {{url: string, method: string, headers: Record<string,string>, protocol?: string}} api
 * @returns {boolean} false when storage is unavailable (private browsing)
 */
export function stageRequest(api) {
  try {
    sessionStorage.setItem(
      PENDING_REQUEST_KEY,
      JSON.stringify({
        url: api.url,
        method: api.method,
        headers: api.headers ?? {},
        body: '',
        protocol: api.protocol ?? 'REST',
      }),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads and clears the staged request in one call.
 *
 * @returns {object|null}
 */
export function takeStagedRequest() {
  let staged = null;
  try {
    const raw = sessionStorage.getItem(PENDING_REQUEST_KEY);
    if (raw) staged = JSON.parse(raw);
  } catch {
    staged = null;
  } finally {
    try {
      sessionStorage.removeItem(PENDING_REQUEST_KEY);
    } catch {
      /* private mode: nothing to clean up */
    }
  }
  return staged;
}
