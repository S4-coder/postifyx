/**
 * Request code generation.
 *
 * Snippets are derived from the same payload the transport sends, so what is
 * copied is what actually goes over the wire. Every language below is one we
 * could verify, and secrets are redacted: an `Authorization` header is rendered
 * as a placeholder rather than copied verbatim, so a snippet pasted into a chat
 * or an issue does not leak a live token.
 */

const REDACTED = 'YOUR_TOKEN';

/** Headers that carry credentials and must never be emitted in the clear. */
const SECRET_HEADERS = new Set(['authorization', 'x-api-key', 'api-key', 'proxy-authorization']);

const isSecret = (key) => SECRET_HEADERS.has(String(key).toLowerCase());

const shellQuote = (value) => {
  // Single quotes are literal in POSIX shells; close-escape any embedded quote.
  const text = String(value);
  return `'${text.replace(/'/g, `'\\''`)}'`;
};

const jsQuote = (value) => JSON.stringify(String(value));

/**
 * @param {{url: string, method: string, headers: Record<string,string>, body?: string}} request
 */
function buildSnippets(request) {
  const method = String(request.method ?? 'GET').toUpperCase();
  const headers = Object.entries(request.headers ?? {}).filter(([key]) => key.trim());
  const body = request.body ?? '';
  const hasBody = body !== '' && !['GET', 'HEAD'].includes(method);

  return {
    curl: buildCurl({ method, url: request.url, headers, body, hasBody }),
    fetch: buildFetch({ method, url: request.url, headers, body, hasBody }),
    python: buildPython({ method, url: request.url, headers, body, hasBody }),
    node: buildNode({ method, url: request.url, headers, body, hasBody }),
  };
}

function buildCurl({ method, url, headers, body, hasBody }) {
  const lines = ['curl --request ' + method, '  --url ' + shellQuote(url)];

  for (const [key, value] of headers) {
    lines.push(`  --header ${shellQuote(`${key}: ${isSecret(key) ? REDACTED : value}`)}`);
  }

  if (hasBody) lines.push(`  --data ${shellQuote(body)}`);
  return lines.join(' \\\n');
}

function buildFetch({ method, url, headers, body, hasBody }) {
  const entries = headers.map(
    ([key, value]) => `    ${jsQuote(key)}: ${jsQuote(isSecret(key) ? REDACTED : value)},`,
  );

  if (hasBody) entries.push('    body: ' + jsQuote(body) + ',');

  return [
    `const response = await fetch(${jsQuote(url)}, {`,
    `  method: ${jsQuote(method)},`,
    entries.length ? '  headers: {\n' + entries.join('\n') + '\n  },' : null,
    hasBody ? '  body, // stringified; pass JSON.stringify(obj) to send an object' : null,
    '});',
    '',
    'const data = await response.json();',
    'console.log(data);',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildPython({ method, url, headers, body, hasBody }) {
  const headerLines = headers.map(
    ([key, value]) => `    "${key}": "${isSecret(key) ? REDACTED : value}",`,
  );

  const payload = hasBody ? '\n    data=' + pyPayload(body) : '';

  return [
    'import requests',
    '',
    `url = "${url}"`,
    '',
    'headers = {',
    ...headerLines,
    '}',
    payload,
    '',
    `response = requests.request("${method}", url, headers=headers${hasBody ? ', data=data' : ''})`,
    'print(response.status_code)',
    'print(response.text)',
  ]
    .filter((line) => line !== undefined)
    .join('\n');
}

/** JSON bodies become a dict literal; anything else stays a raw string. */
function pyPayload(body) {
  try {
    const parsed = JSON.parse(body);
    return JSON.stringify(parsed, null, 2).replace(/^/gm, '    ').trimStart();
  } catch {
    return JSON.stringify(body);
  }
}

function buildNode({ method, url, headers, body, hasBody }) {
  const headerLines = headers.map(
    ([key, value]) => `    ${jsQuote(key)}: ${jsQuote(isSecret(key) ? REDACTED : value)},`,
  );

  return [
    "import https from 'node:https';",
    '',
    'const target = new URL(' + jsQuote(url) + ');',
    '',
    'const options = {',
    `  method: ${jsQuote(method)},`,
    '  hostname: target.hostname,',
    '  path: target.pathname + target.search,',
    ...headerLines,
    hasBody ? `  body: ${jsQuote(body)},` : null,
    '};',
    '',
    'const req = https.request(options, (res) => {',
    '  let raw = "";',
    '  res.on("data", (chunk) => (raw += chunk));',
    '  res.on("end", () => console.log(raw));',
    '});',
    '',
    'req.end();',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export const SNIPPET_LANGUAGES = [
  { id: 'curl', label: 'cURL' },
  { id: 'fetch', label: 'Fetch' },
  { id: 'python', label: 'Python' },
  { id: 'node', label: 'Node.js' },
];

/** @returns {Record<string, string>} snippet id to source. */
export function generateSnippets(request) {
  return buildSnippets(request);
}
