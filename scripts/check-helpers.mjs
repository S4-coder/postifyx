// Exercises the pure helpers that the UI depends on, outside the browser.
import { generateSnippets } from '../src/lib/codeGen.js';
import { formatBody, BODY_FORMATS, countStats } from '../src/lib/bodyFormats.js';
import { buildShareUrl, takeSharedRequest } from '../src/lib/share.js';
import { appendRequestParams, extractRequestParams } from '../src/lib/requestParams.js';
import { buildGraphQLBody, parseGraphQLVariables } from '../src/lib/graphql.js';

let failures = 0;
const check = (name, condition, detail = '') => {
  if (condition) {
    console.log(`  ok    ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
};

const request = {
  url: 'https://api.example.com/v1/users',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer supersecret', 'X-Api-Key': 'k-123' },
  body: '{"name":"Ada"}',
};

const snippets = generateSnippets(request);

console.log('codeGen');
check('curl has method', snippets.curl.includes('--request POST'));
check('curl has url', snippets.curl.includes('api.example.com/v1/users'));
check('curl quotes body', snippets.curl.includes("'{\"name\":\"Ada\"}'"));
check('curl redacts Authorization', snippets.curl.includes('YOUR_TOKEN'));
check('curl does not leak the token', !snippets.curl.includes('supersecret'));
check('curl does not leak the api key', !snippets.curl.includes('k-123'));
check('fetch redacts', snippets.fetch.includes('YOUR_TOKEN') && !snippets.fetch.includes('supersecret'));
check('python redacts', snippets.python.includes('YOUR_TOKEN') && !snippets.python.includes('supersecret'));
check('node redacts', snippets.node.includes('YOUR_TOKEN') && !snippets.node.includes('supersecret'));
check('python uses a dict payload', snippets.python.includes('"name": "Ada"'));
check('node parses the URL once', snippets.node.includes('const target = new URL('));

const getSnippet = generateSnippets({ ...request, method: 'GET', body: '' });
check('GET omits the body', !getSnippet.curl.includes('--data'));

const quoteSnippet = generateSnippets({ ...request, body: "it's here" });
check('single quotes are escaped', quoteSnippet.curl.includes(`'it'\\''s here'`), quoteSnippet.curl);

console.log('bodyFormats');
check('five formats', BODY_FORMATS.length === 5);
check('json content type', BODY_FORMATS.find((f) => f.id === 'json').contentType === 'application/json');
check('html content type', BODY_FORMATS.find((f) => f.id === 'html').contentType === 'text/html');
check('text content type', BODY_FORMATS.find((f) => f.id === 'text').contentType === 'text/plain');

const pretty = formatBody('{"a":1,"b":[2,3]}', 'json');
check('json is re-indented', pretty.text === '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}', JSON.stringify(pretty.text));

const broken = formatBody('{bad', 'json');
check('invalid json reports an error', broken.error !== null && broken.text === '{bad');

const js = formatBody('const a=1;', 'javascript');
check('javascript is left alone', js.text === 'const a=1;' && js.error === null);

const xml = formatBody('<a><b>c</b></a>', 'xml');
check('xml is broken across lines', xml.text.includes('\n'), JSON.stringify(xml.text));

check('byte count is utf-8 aware', countStats('héllo').bytes === 6, String(countStats('héllo').bytes));
check('line count', countStats('a\nb\nc').lines === 3);

console.log('requestParams');
const extractedParams = extractRequestParams('https://api.example.com/items?tag=a&tag=b&skip=2');
check('extracts query parameters and keeps duplicate keys', extractedParams?.params.length === 3);
check(
  'extracts query parameters without changing their values',
  extractedParams?.params[0].key === 'tag' &&
    extractedParams.params[0].value === 'a' &&
    extractedParams.params[1].value === 'b',
);
check(
  'extracts a clean base URL',
  extractedParams?.url === 'https://api.example.com/items',
);
check('ignores non-http URL schemes', extractRequestParams('wss://example.com/events') === null);
check('preserves manually entered params for a URL without query', extractRequestParams('https://api.example.com/items') === null);
const parameterUrl = appendRequestParams(
  extractedParams.url,
  [
    { key: 'tag', value: 'a', enabled: true },
    { key: 'tag', value: 'b', enabled: true },
    { key: 'skip', value: '2', enabled: false },
    { key: 'search', value: '{{term}}', enabled: true },
  ],
  (value) => value.replace('{{term}}', 'red fox'),
);
const roundTrippedParams = new URL(parameterUrl).searchParams;
check('appends duplicate parameter keys', roundTrippedParams.getAll('tag').join(',') === 'a,b');
check('omits disabled parameters', !roundTrippedParams.has('skip'));
check('interpolates values and URL-encodes spaces', roundTrippedParams.get('search') === 'red fox');

console.log('graphql');
const graphqlBody = JSON.parse(
  buildGraphQLBody(
    'query User($id: ID!) { user(id: $id) { name } }',
    '{"id":"{{user_id}}"}',
    { user_id: '7' },
  ),
);
check('builds GraphQL POST body with interpolated query and variables', graphqlBody.variables.id === '7');
check('rejects non-object GraphQL variables', (() => {
  try {
    parseGraphQLVariables('[]');
    return false;
  } catch {
    return true;
  }
})());

const previousWindow = globalThis.window;
const previousHistory = globalThis.history;
globalThis.window = {
  location: { origin: 'https://postifyx.example', pathname: '/app', search: '', hash: '' },
};
globalThis.history = {
  replaceState: (_state, _title, url) => {
    const location = new URL(url, globalThis.window.location.origin);
    Object.assign(globalThis.window.location, {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  },
};

const shareUrl = buildShareUrl({
  url: 'https://api.example.com/items',
  method: 'GET',
  headers: { Authorization: 'secret-token', Accept: 'application/json' },
  protocol: 'GRAPHQL',
  graphql: { query: 'query { viewer { login } }', variables: '{}' },
});
const sharePayload = JSON.parse(
  Buffer.from(new URL(shareUrl).hash.slice(3), 'base64url').toString('utf8'),
);
check('share link stores payload in fragment', new URL(shareUrl).hash.startsWith('#r='));
check(
  'share link redacts authorization',
  sharePayload.h.Authorization === 'YOUR_TOKEN' && !JSON.stringify(sharePayload).includes('secret-token'),
);

globalThis.window.location.hash = new URL(shareUrl).hash;
const restoredRequest = takeSharedRequest();
check('share link restores request', restoredRequest?.url === 'https://api.example.com/items');
check('share link restores GraphQL request protocol', restoredRequest?.protocol === 'GRAPHQL');
check('share link restores GraphQL editor content', restoredRequest?.graphql?.query === 'query { viewer { login } }');
check(
  'share link restores headers as an object',
  restoredRequest?.headers.Authorization === 'YOUR_TOKEN',
);
check('share link clears fragment after reading', globalThis.window.location.hash === '');

if (previousWindow === undefined) delete globalThis.window;
else globalThis.window = previousWindow;
if (previousHistory === undefined) delete globalThis.history;
else globalThis.history = previousHistory;

console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);
