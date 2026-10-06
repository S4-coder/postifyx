/**
 * Protocol metadata shared by the workspace switcher and the landing page.
 * Single source of truth so marketing copy and the app UI cannot drift.
 */

export const PROTOCOLS = [
  {
    id: 'REST',
    label: 'REST API',
    tagline: 'Any method, any host',
    description:
      'Full method, header and body control over a native HTTP client. No CORS, no browser preflight.',
    accent: 'indigo',
    implemented: true,
    /** Desktop-only transports cannot run in a browser tab. */
    desktopOnly: false,
  },
  {
    id: 'GRAPHQL',
    label: 'GraphQL',
    tagline: 'Query, variables, headers',
    description:
      'Write a query, attach variables, and send it as a POST with an application/json body.',
    accent: 'emerald',
    implemented: true,
    desktopOnly: false,
  },
  {
    id: 'GRPC',
    label: 'gRPC',
    tagline: 'Protobuf over HTTP/2',
    description:
      'Paste a descriptor set, pick a method, and send a JSON message over HTTP/2 with dynamic protobuf reflection.',
    accent: 'sky',
    implemented: true,
    desktopOnly: true,
  },
  {
    id: 'WS',
    label: 'WebSocket',
    tagline: 'Live socket console',
    description:
      'Persistent bidirectional frames with a message log, plus an outbound frame composer.',
    accent: 'amber',
    implemented: true,
    desktopOnly: false,
  },
  {
    id: 'SSE',
    label: 'SSE / Events',
    tagline: 'Server-sent streams',
    description:
      'Stream server-sent events with a live inspector. Named events are decoded and highlighted.',
    accent: 'rose',
    implemented: true,
    desktopOnly: false,
  },
];

export const PROTOCOL_IDS = PROTOCOLS.map((p) => p.id);

/** Protocols whose UI is a stream console rather than a request/response pair. */
export const STREAMING_PROTOCOLS = ['WS', 'SSE'];

/** Protocols that need dedicated config beyond URL/method/headers. */
export const HAS_DEDICATED_UI = ['GRPC', 'WS', 'SSE'];

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/** Colour class per method, used for the selector and history rows. */
export const METHOD_COLOR = {
  GET: 'text-emerald-400',
  POST: 'text-emerald-400',
  PUT: 'text-amber-400',
  PATCH: 'text-sky-400',
  DELETE: 'text-rose-400',
  HEAD: 'text-slate-400',
  OPTIONS: 'text-slate-400',
};

export function getProtocol(id) {
  return PROTOCOLS.find((p) => p.id === id) ?? PROTOCOLS[0];
}

export function isStreaming(protocol) {
  return STREAMING_PROTOCOLS.includes(protocol);
}

export function hasDedicatedUI(protocol) {
  return HAS_DEDICATED_UI.includes(protocol);
}

/** Maps a protocol to the HTTP method it will actually send. */
export function methodForProtocol(protocol, currentMethod) {
  if (protocol === 'GRAPHQL') return 'POST';
  return currentMethod;
}

/** Classifies a status code for badge colouring. */
export function statusTone(status) {
  if (!status) return { text: 'text-rose-400', label: 'Failed' };
  if (status >= 500) return { text: 'text-rose-400', label: 'Server error' };
  if (status >= 400) return { text: 'text-amber-400', label: 'Client error' };
  if (status >= 300) return { text: 'text-sky-400', label: 'Redirect' };
  if (status >= 200) return { text: 'text-emerald-400', label: 'Success' };
  return { text: 'text-slate-400', label: 'Informational' };
}

/** Human-readable byte size. */
export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exp;
  return `${value >= 10 || exp === 0 ? Math.round(value) : value.toFixed(1)} ${units[exp]}`;
}
