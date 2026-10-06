/**
 * Body payload formats.
 *
 * The format is a UI-level concern: it decides which editor affordance the body
 * pane offers and which `Content-Type` the request advertises. The bytes sent
 * are always the raw text in the editor — no serialisation happens, because the
 * user is writing the body by hand, not handing over an object to be encoded.
 */

export const BODY_FORMATS = [
  { id: 'json', label: 'JSON', contentType: 'application/json', extension: 'json' },
  { id: 'xml', label: 'XML', contentType: 'application/xml', extension: 'xml' },
  { id: 'javascript', label: 'JS', contentType: 'application/javascript', extension: 'js' },
  { id: 'html', label: 'HTML', contentType: 'text/html', extension: 'html' },
  { id: 'text', label: 'Text', contentType: 'text/plain', extension: 'txt' },
];

export const DEFAULT_BODY_FORMAT = 'json';

export function getBodyFormat(id) {
  return BODY_FORMATS.find((f) => f.id === id) ?? BODY_FORMATS[0];
}

/** Content type a format implies, used to sync the request headers. */
export function contentTypeFor(id) {
  return getBodyFormat(id).contentType;
}

/**
 * Re-indents a payload. Only JSON is machine-formattable; for the other
 * formats the original text is returned untouched rather than mangled by a
 * generic reformatter that does not understand the grammar.
 *
 * @param {string} text
 * @param {string} formatId
 * @returns {{ text: string, error: string|null }}
 */
export function formatBody(text, formatId) {
  if (!text.trim()) return { text, error: null };

  if (formatId === 'json') {
    try {
      return { text: JSON.stringify(JSON.parse(text), null, 2), error: null };
    } catch (err) {
      return { text, error: `Invalid JSON: ${err.message}` };
    }
  }

  if (formatId === 'xml' || formatId === 'html') {
    // Indent between tags only. This is a presentation nicety, so a malformed
    // document must not throw — the payload is still sent verbatim.
    const indented = text
      .replace(/>\s*</g, '>\n<')
      .split('\n')
      .map((line, depth) => `${'  '.repeat(depth < 0 ? 0 : depth)}${line.trim()}`)
      .join('\n');
    return { text: indented, error: null };
  }

  return { text, error: null };
}

/** Line count for the editor's status bar. */
export function countStats(text) {
  const value = String(text ?? '');
  if (!value) return { lines: 0, bytes: 0 };
  return {
    lines: value.split('\n').length,
    // TextEncoder gives the real byte length, which differs from `.length` for
    // any non-ASCII payload.
    bytes: new TextEncoder().encode(value).length,
  };
}
