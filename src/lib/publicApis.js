/**
 * Curated public APIs for the /apis directory.
 *
 * Every entry was checked against its live response before being added here. If
 * one starts failing, that is a service-side change, not a bug in OpenClient —
 * but please re-verify before adding new entries, because a "Run in App" that
 * returns a deprecation notice is worse than no entry at all.
 */

const ACCEPT_JSON = [{ key: 'Accept', value: 'application/json', enabled: true }];

export const PUBLIC_APIS = [
  {
    id: 'github-zen',
    name: 'GitHub Zen',
    category: 'Developer',
    auth: 'None',
    description: 'One line of API wisdom. The fastest way to confirm a 200 round trip.',
    method: 'GET',
    url: 'https://api.github.com/zen',
    // GitHub rejects `text/plain` here with a 415; the vendor media type is
    // the only accepted value even though the body is not JSON.
    headers: [{ key: 'Accept', value: 'application/vnd.github+json', enabled: true }],
  },
  {
    id: 'github-repo',
    name: 'GitHub Repositories',
    category: 'Developer',
    auth: 'Optional token',
    description: 'Repo metadata, releases and issues. Works unauthenticated at 60 requests/hour.',
    method: 'GET',
    url: 'https://api.github.com/repos/tauri-apps/tauri/releases/latest',
    headers: [
      { key: 'Accept', value: 'application/vnd.github+json', enabled: true },
      { key: 'X-GitHub-Api-Version', value: '2022-11-28', enabled: true },
    ],
  },
  {
    id: 'jsonplaceholder',
    name: 'JSONPlaceholder',
    category: 'Testing',
    auth: 'None',
    description: 'Fake REST data for prototyping: users, posts, todos, comments.',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/todos?_limit=5',
    headers: ACCEPT_JSON,
  },
  {
    id: 'httpbin',
    name: 'HTTPBin',
    category: 'Testing',
    auth: 'None',
    description: 'Request and response echo service with status, redirect, delay and cookie endpoints.',
    method: 'GET',
    url: 'https://httpbin.org/get',
    headers: ACCEPT_JSON,
  },
  {
    id: 'open-meteo',
    name: 'Open-Meteo',
    category: 'Weather',
    auth: 'None',
    description: 'Free weather forecast with no API key. Accepts coordinates in the path or query.',
    method: 'GET',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.21&current=temperature_2m',
    headers: ACCEPT_JSON,
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    category: 'News',
    auth: 'None',
    description: 'Top stories and item lookups from the official Firebase HN API.',
    method: 'GET',
    url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    headers: ACCEPT_JSON,
  },
  {
    id: 'coingecko',
    name: 'CoinGecko',
    category: 'Finance',
    auth: 'Optional key',
    description: 'Crypto market data. The public tier works without a key at a lower rate limit.',
    method: 'GET',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    headers: ACCEPT_JSON,
  },
  {
    id: 'openalex',
    name: 'OpenAlex',
    category: 'Reference',
    auth: 'None',
    description: 'Open scholarly database of papers, authors and institutions. No key required.',
    method: 'GET',
    url: 'https://api.openalex.org/works?search=rust&per-page=2',
    headers: ACCEPT_JSON,
  },
  {
    id: 'pokeapi',
    name: 'PokéAPI',
    category: 'Fun',
    auth: 'None',
    description: 'Creature, move and location data behind the games. Free and open, no key.',
    method: 'GET',
    url: 'https://pokeapi.co/api/v2/pokemon/ditto',
    headers: ACCEPT_JSON,
  },
  {
    id: 'dog-ceo',
    name: 'Dog CEO',
    category: 'Fun',
    auth: 'None',
    description: 'Returns a random dog breed image URL. Handy for testing image handling.',
    method: 'GET',
    url: 'https://dog.ceo/api/breeds/image/random',
    headers: ACCEPT_JSON,
  },
];

export const API_CATEGORIES = ['All', ...new Set(PUBLIC_APIS.map((a) => a.category))];

/**
 * Streaming targets. These cannot come from a public directory because the
 * public options are rate-limited or long-dead, so the local demo server is the
 * default instead. Start it with `node server/demo-streams.mjs`.
 */
export const STREAM_EXAMPLES = [
  {
    id: 'demo-ws',
    name: 'Local WebSocket echo',
    category: 'WebSocket',
    protocol: 'WS',
    description: 'Echoes every frame you send, which makes it easy to confirm both directions work.',
    url: 'ws://localhost:8788/ws',
    headers: {},
  },
  {
    id: 'demo-sse',
    name: 'Local SSE stream',
    category: 'SSE',
    protocol: 'SSE',
    description: 'Emits one named `tick` event per second with a JSON payload.',
    url: 'http://localhost:8788/sse',
    headers: {},
  },
];
