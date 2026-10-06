// Exercises the pure helpers that the UI depends on, outside the browser.
import { generateSnippets } from '../src/lib/codeGen.js';
import { formatBody, BODY_FORMATS, countStats } from '../src/lib/bodyFormats.js';

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

console.log(failures ? `\n${failures} failing` : '\nall passing');
process.exit(failures ? 1 : 0);
