'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { methodForProtocol } from '@/lib/protocols';
import { describeUrlProblem, SSE_SCHEMES, WS_SCHEMES } from '@/lib/urlCheck';
import { DEFAULT_BODY_FORMAT, contentTypeFor } from '@/lib/bodyFormats';

/**
 * Default headers offered on a fresh request. `enabled: false` keeps the
 * template visible without sending the header.
 */
const defaultHeaders = () => [
  { key: 'Accept', value: 'application/json', enabled: true },
  { key: 'User-Agent', value: 'OpenClient/0.1.0', enabled: false },
  { key: 'Content-Type', value: 'application/json', enabled: true },
];

/** Variable interpolation for environment values, e.g. `{{base_url}}`. */
const interpolate = (template, vars) =>
  Object.entries(vars || {}).reduce(
    (acc, [key, value]) => acc.split(`{{${key}}}`).join(value),
    String(template ?? ''),
  );

const emptyResponse = () => ({
  status: 0,
  status_text: '',
  headers: {},
  body: '',
  time_ms: 0,
  size_bytes: 0,
  error: null,
  truncated: false,
});

/** Fields that belong to a request tab rather than to the workspace. */
const TAB_KEYS = ['protocol', 'method', 'url', 'headers', 'body', 'bodyFormat', 'auth', 'grpc'];

/**
 * Reads the tab-owned fields off the store state.
 *
 * `grpc.services` is deliberately excluded: it is derived from the descriptor
 * set at runtime and can be large, so it must never reach localStorage.
 */
const readTab = (state) => {
  const tab = {};
  for (const key of TAB_KEYS) tab[key] = state[key];
  tab.grpc = { ...tab.grpc, services: [] };
  return tab;
};

/** Applies a patch to the live fields *and* mirrors it into the active tab. */
const withTab = (state, patch) => ({
  ...patch,
  tabs: state.tabs.map((t) => (t.id === state.activeTabId ? { ...t, ...readTab({ ...state, ...patch }) } : t)),
});

const newTabId = () => `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** A blank tab, pre-filled with the header template so it is immediately usable. */
const blankTab = (overrides = {}) => ({
  id: newTabId(),
  title: 'Untitled request',
  protocol: 'REST',
  method: 'GET',
  url: '',
  headers: defaultHeaders(),
  body: '',
  bodyFormat: DEFAULT_BODY_FORMAT,
  auth: { type: 'none', token: '', username: '', password: '', header: 'Authorization' },
  grpc: {
    service: '',
    method: '',
    descriptorSet: '',
    message: '{}',
    insecure: false,
    metadata: [{ key: '', value: '' }],
    services: [],
  },
  ...overrides,
});

/**
 * The first tab is built here rather than inline so `activeTabId` can be seeded
 * with the same value. Leaving it empty would mean `withTab` matches no tab, and
 * the first switch would silently discard whatever the user had typed.
 */
const initialTab = blankTab({ url: 'https://jsonplaceholder.typicode.com/todos/1' });

export const useRequestStore = create(
  persist(
    (set, get) => ({
      // ── Request tabs ──────────────────────────────────────────────────────
      // The flat fields below are the *live* request; `tabs` mirrors them so a
      // tab can be closed and restored. One writer (`withTab`) keeps the two in
      // step, so they cannot drift.
      tabs: [initialTab],
      activeTabId: initialTab.id,
      /** Saved request groups. Persisted so a workspace survives a reload. */
      collections: [],

      // ── Protocol & environment ────────────────────────────────────────────
      protocol: 'REST',
      environments: [
        { id: 'local', name: 'Local', values: { base_url: 'http://localhost:3000' } },
        { id: 'public', name: 'Public APIs', values: { base_url: 'https://api.publicapis.org' } },
      ],
      activeEnvId: 'local',

      // ── Request config ────────────────────────────────────────────────────
      url: 'https://jsonplaceholder.typicode.com/todos/1',
      method: 'GET',
      headers: defaultHeaders(),
      body: '',
      /** Drives the body editor's affordance and the Content-Type default. */
      bodyFormat: DEFAULT_BODY_FORMAT,
      auth: { type: 'none', token: '', username: '', password: '', header: 'Authorization' },

      // ── Execution state ───────────────────────────────────────────────────
      loading: false,
      response: emptyResponse(),
      /** Most recent executions, newest first. Capped to keep memory flat. */
      history: [],

      // ── Streaming state (WS / SSE) ────────────────────────────────────────
      /** 'idle' | 'connecting' | 'open' | 'closed' | 'error' */
      streamStatus: 'idle',
      streamError: null,
      /** Newest frames first, capped so a fast stream cannot grow unbounded. */
      streamMessages: [],
      /** Draft text for the outbound WebSocket frame composer. */
      wsOutbound: '',
      /** Live controller for the open stream; never persisted. */
      streamController: null,

      // ── gRPC state ────────────────────────────────────────────────────────
      grpc: {
        service: '',
        method: '',
        descriptorSet: '',
        message: '{}',
        insecure: false,
        metadata: [{ key: '', value: '' }],
        services: [],
      },
      grpcResult: null,

      // ── Protocol actions ──────────────────────────────────────────────────
      setProtocol: (protocol) =>
        set((state) => ({
          ...withTab(state, {
            protocol,
            method: methodForProtocol(protocol, state.method),
          }),
          response: emptyResponse(),
        })),

      // ── Environment actions ───────────────────────────────────────────────
      setActiveEnv: (activeEnvId) => set({ activeEnvId }),

      updateEnvValue: (envId, key, value) =>
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === envId ? { ...env, values: { ...env.values, [key]: value } } : env,
          ),
        })),

      addEnvVar: (envId, key) =>
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === envId ? { ...env, values: { ...env.values, [key]: '' } } : env,
          ),
        })),

      removeEnvVar: (envId, key) =>
        set((state) => ({
          environments: state.environments.map((env) => {
            if (env.id !== envId) return env;
            const next = { ...env.values };
            delete next[key];
            return { ...env, values: next };
          }),
        })),

      addEnvironment: (name) => {
        const id = `env-${Date.now().toString(36)}`;
        set((state) => ({
          environments: [...state.environments, { id, name, values: { base_url: '' } }],
          activeEnvId: id,
        }));
      },

      // ── Request field actions ─────────────────────────────────────────────
      setUrl: (url) => set((state) => withTab(state, { url })),
      setMethod: (method) => set((state) => withTab(state, { method })),
      setBody: (body) => set((state) => withTab(state, { body })),

      /**
       * Switching format also rewrites an enabled `Content-Type` header, so the
       * advertised type cannot contradict what the editor is treating as JSON,
       * XML and so on. A header the user disabled is left alone.
       */
      setBodyFormat: (bodyFormat) =>
        set((state) => {
          const contentType = contentTypeFor(bodyFormat);
          const hasContentType = state.headers.some(
            (h) => h.enabled && h.key.trim().toLowerCase() === 'content-type',
          );

          return withTab(state, {
            bodyFormat,
            headers: hasContentType
              ? state.headers.map((h) =>
                  h.enabled && h.key.trim().toLowerCase() === 'content-type'
                    ? { ...h, value: contentType }
                    : h,
                )
              : state.headers,
          });
        }),

      setAuth: (patch) =>
        set((state) => withTab(state, { auth: { ...state.auth, ...patch } })),

      addHeader: () =>
        set((state) =>
          withTab(state, { headers: [...state.headers, { key: '', value: '', enabled: true }] }),
        ),

      updateHeader: (index, patch) =>
        set((state) =>
          withTab(state, {
            headers: state.headers.map((h, i) => (i === index ? { ...h, ...patch } : h)),
          }),
        ),

      removeHeader: (index) =>
        set((state) => withTab(state, { headers: state.headers.filter((_, i) => i !== index) })),

      /** Drops rows the user left blank so we never send an empty header. */
      pruneHeaders: () =>
        set((state) =>
          withTab(state, {
            headers: state.headers.filter(
              (h) => h.key.trim() !== '' || h.value.trim() !== '',
            ),
          }),
        ),

      // ── Execution ─────────────────────────────────────────────────────────
      setLoading: (loading) => set({ loading }),
      setResponse: (response) => set({ response }),
      clearResponse: () => set({ response: emptyResponse() }),

      /**
       * Builds the concrete request that will be handed to the Rust engine:
       * environment variables are resolved, disabled headers are dropped, and
       * the auth config is folded into a real header.
       */
      buildPayload: () => {
        const state = get();
        const env = state.environments.find((e) => e.id === state.activeEnvId);
        const vars = env?.values ?? {};

        const headers = state.headers
          .filter((h) => h.enabled && h.key.trim() !== '')
          .reduce((acc, h) => {
            acc[h.key.trim()] = interpolate(h.value, vars);
            return acc;
          }, {});

        if (state.auth?.type === 'bearer' && state.auth.token.trim()) {
          headers[state.auth.header || 'Authorization'] = `Bearer ${interpolate(
            state.auth.token.trim(),
            vars,
          )}`;
        }

        if (state.auth?.type === 'basic' && state.auth.username) {
          headers['Authorization'] = `Basic ${btoa(
            `${interpolate(state.auth.username, vars)}:${interpolate(state.auth.password ?? '', vars)}`,
          )}`;
        }

        if (state.auth?.type === 'apikey' && state.auth.token.trim()) {
          headers['X-API-Key'] = interpolate(state.auth.token.trim(), vars);
        }

        const body = interpolate(state.body, vars);

        return {
          url: interpolate(state.url, vars).trim(),
          method: state.method,
          headers,
          body: body === '' ? undefined : body,
        };
      },

      /** Runs the active request through the desktop engine and records history. */
      execute: async () => {
        const payload = get().buildPayload();

        if (!payload.url) {
          set({
            response: { ...emptyResponse(), error: 'Enter a request URL first.' },
          });
          return;
        }

        set({ loading: true, response: emptyResponse() });

        try {
          const { sendRequest } = await import('@/lib/tauri');
          const response = await sendRequest(payload);

          const entry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            method: payload.method,
            url: payload.url,
            protocol: get().protocol,
            status: response.status,
            time_ms: response.time_ms,
            at: new Date().toISOString(),
          };

          set((state) => ({
            loading: false,
            response,
            history: [entry, ...state.history].slice(0, 25),
          }));
        } catch (err) {
          set({
            loading: false,
            response: { ...emptyResponse(), error: `Unexpected engine failure: ${String(err)}` },
          });
        }
      },

/**
       * Stages a URL as the new target without sending anything. Used by the
       * /apis directory when a stream example is one-clicked.
       */
      applyStagedRequest: (staged) => {
        if (!staged?.url) return;

        const rows = Object.entries(staged.headers ?? {}).map(([key, value]) => ({
          key,
          value: String(value),
          enabled: true,
        }));

        set((state) => ({
          ...withTab(state, {
            protocol: staged.protocol ?? state.protocol,
            url: staged.url,
            method: staged.method ?? state.method,
            headers: rows.length ? rows : state.headers,
            body: staged.body ?? state.body,
          }),
          response: emptyResponse(),
        }));
      },

      /** Replays a history entry back into the editor. */
      loadFromHistory: (id) => {
        const entry = get().history.find((h) => h.id === id);
        if (!entry) return;
        set((state) => ({
          ...withTab(state, {
            protocol: entry.protocol ?? state.protocol,
            url: entry.url,
            method: entry.method,
          }),
          response: emptyResponse(),
        }));
      },

      /**
       * Opens a WebSocket or SSE stream, replacing any existing one.
       *
       * Frames are appended to `streamMessages`, which is capped: a busy
       * stream would otherwise grow without bound.
       */
      connectStream: async () => {
        const state = get();
        const env = state.environments.find((e) => e.id === state.activeEnvId);
        const url = interpolate(state.url, env?.values ?? {}).trim();

        // A scheme-less value would be opened as a path on this app's own
        // origin, which fails with an opaque 404 rather than a useful error.
        const schemes = state.protocol === 'WS' ? WS_SCHEMES : SSE_SCHEMES;
        const problem = describeUrlProblem(url, { schemes, label: 'Stream URL' });
        if (problem) {
          set({ streamStatus: 'error', streamError: problem });
          return;
        }

        // Replace any previous connection rather than stacking them.
        await get().disconnectStream();

        set({ streamStatus: 'connecting', streamError: null, streamMessages: [] });

        const headers = state.headers
          .filter((h) => h.enabled && h.key.trim() !== '')
          .reduce((acc, h) => {
            acc[h.key.trim()] = interpolate(h.value, env?.values ?? {});
            return acc;
          }, {});

        const onMessage = (msg) => {
          set((s) => ({
            streamMessages: [
              { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...msg },
              // Newest first; 200 frames is plenty of scrollback.
              ...s.streamMessages,
            ].slice(0, 200),
          }));
        };

        const onStatus = (status, detail) =>
          set({ streamStatus: status, streamError: status === 'error' ? detail ?? null : null });

        try {
          const streams = await import('@/lib/streams');

          const controller =
            state.protocol === 'WS'
              ? await streams.openWebSocket({ url }, onMessage, onStatus)
              : await streams.openEventStream({ url, headers }, onMessage, onStatus);

          set({ streamController: controller });
        } catch (err) {
          set({
            streamStatus: 'error',
            streamError: err?.message ?? String(err),
            streamController: null,
          });
        }
      },

      /** Closes the open stream, if any. Safe to call when nothing is open. */
      disconnectStream: async () => {
        const controller = get().streamController;
        if (!controller) return;

        set({ streamController: null, streamStatus: 'closed' });

        try {
          await controller.close();
        } catch {
          /* already closed by the peer; nothing to recover */
        }
      },

      /** Sends an outbound WebSocket frame. No-op for SSE, which is unidirectional. */
      sendStreamFrame: () => {
        const { streamController, wsOutbound, protocol } = get();
        if (protocol !== 'WS' || !streamController) return;

        try {
          streamController.send(wsOutbound);
          set({ wsOutbound: '' });
        } catch (err) {
          set({ streamError: String(err?.message ?? err) });
        }
      },

      setWsOutbound: (wsOutbound) => set({ wsOutbound }),
      clearStream: () => set({ streamMessages: [], streamError: null, streamStatus: 'idle' }),

      // ── gRPC actions ──────────────────────────────────────────────────────
      setGrpc: (patch) => set((state) => withTab(state, { grpc: { ...state.grpc, ...patch } })),

      addGrpcMetadata: () =>
        set((state) =>
          withTab(state, {
            grpc: { ...state.grpc, metadata: [...state.grpc.metadata, { key: '', value: '' }] },
          }),
        ),

      updateGrpcMetadata: (index, patch) =>
        set((state) =>
          withTab(state, {
            grpc: {
              ...state.grpc,
              metadata: state.grpc.metadata.map((m, i) => (i === index ? { ...m, ...patch } : m)),
            },
          }),
        ),

      removeGrpcMetadata: (index) =>
        set((state) =>
          withTab(state, {
            grpc: {
              ...state.grpc,
              metadata: state.grpc.metadata.filter((_, i) => i !== index),
            },
          }),
        ),

      /** Reads the descriptor set and populates the service/method picker. */
      describeGrpcServices: async () => {
        const { descriptorSet } = get().grpc;

        if (!descriptorSet.trim()) {
          set((state) => withTab(state, { grpc: { ...state.grpc, services: [] } }));
          return;
        }

        const streams = await import('@/lib/streams');
        const services = await streams.describeGrpcServices(descriptorSet);

        set((state) =>
          withTab(state, {
            grpc: {
              ...state.grpc,
              services,
              // Preselect the first service so a single-descriptor demo needs one click.
              service: state.grpc.service || services[0]?.name || '',
            },
          }),
        );
      },

      /** Runs a unary gRPC call through the Rust transport. */
      executeGrpc: async () => {
        const state = get();
        const env = state.environments.find((e) => e.id === state.activeEnvId);
        const vars = env?.values ?? {};

        if (!state.grpc.service.trim() || !state.grpc.method.trim()) {
          set({ grpcResult: { error: 'Pick a service and a method first.', grpcStatus: 'INVALID_ARGUMENT' } });
          return;
        }

        set({ loading: true, grpcResult: null });

        try {
          const streams = await import('@/lib/streams');

          const result = await streams.callGrpc({
            url: interpolate(state.url, vars).trim(),
            service: state.grpc.service.trim(),
            method: state.grpc.method.trim(),
            descriptorSet: state.grpc.descriptorSet.trim(),
            message: state.grpc.message || '{}',
            insecure: state.grpc.insecure,
            metadata: state.grpc.metadata
              .filter((m) => m.key.trim())
              .reduce((acc, m) => {
                acc[m.key.trim()] = interpolate(m.value, vars);
                return acc;
              }, {}),
          });

          set({ loading: false, grpcResult: result });
        } catch (err) {
          set({ loading: false, grpcResult: { error: String(err), grpcStatus: 'UNKNOWN' } });
        }
      },

      clearHistory: () => set({ history: [] }),

      // ── Tab actions ───────────────────────────────────────────────────────
      /**
       * Activates a tab, first folding the live request into the tab being left
       * so unsaved edits are never dropped.
       */
      setActiveTab: (id) =>
        set((state) => {
          if (id === state.activeTabId) return {};
          const target = state.tabs.find((t) => t.id === id);
          if (!target) return {};

          return {
            ...readTab(target),
            activeTabId: id,
            response: emptyResponse(),
            grpcResult: null,
            streamMessages: [],
          };
        }),

      addTab: (overrides = {}) =>
        set((state) => {
          const tab = blankTab(overrides);
          return {
            tabs: [...state.tabs, tab],
            activeTabId: tab.id,
            ...readTab(tab),
            response: emptyResponse(),
            grpcResult: null,
            streamMessages: [],
          };
        }),

      closeTab: (id) =>
        set((state) => {
          if (state.tabs.length === 1) {
            // Never leave zero tabs: reset the last one instead.
            const fresh = blankTab();
            return { tabs: [fresh], activeTabId: fresh.id, ...readTab(fresh) };
          }

          const remaining = state.tabs.filter((t) => t.id !== id);
          const wasActive = state.activeTabId === id;
          const nextActive = wasActive ? remaining[remaining.length - 1] : null;

          return {
            tabs: remaining,
            ...(nextActive ? { activeTabId: nextActive.id, ...readTab(nextActive) } : {}),
          };
        }),

      renameTab: (id, title) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === id ? { ...t, title } : t)),
        })),

      closeOtherTabs: (id) =>
        set((state) => {
          const keep = state.tabs.filter((t) => t.id === id);
          return { tabs: keep.length ? keep : state.tabs };
        }),

      // ── Collection actions ────────────────────────────────────────────────
      /**
       * Saves the live request into a collection, creating the collection if it
       * does not exist yet. Returns the id of the new collection so the caller
       * can select it.
       */
      saveToCollection: (collectionName, requestName) => {
        const name = collectionName.trim() || 'Default';
        const state = get();
        const request = {
          id: `req-${Date.now().toString(36)}`,
          name: requestName?.trim() || state.tabs.find((t) => t.id === state.activeTabId)?.title || 'Untitled request',
          ...readTab(state),
        };

        set((s) => {
          const existing = s.collections.find((c) => c.name === name);
          if (existing) {
            return {
              collections: s.collections.map((c) =>
                c.id === existing.id
                  ? { ...c, requests: [...c.requests.filter((r) => r.name !== request.name), request] }
                  : c,
              ),
            };
          }

          const created = { id: `col-${Date.now().toString(36)}`, name, requests: [request] };
          return { collections: [...s.collections, created] };
        });

        return name;
      },

      /** Opens a saved request in a new tab, leaving the current one intact. */
      openFromCollection: (collectionId, requestId) =>
        set((state) => {
          const saved = state.collections
            .find((c) => c.id === collectionId)
            ?.requests.find((r) => r.id === requestId);
          if (!saved) return {};

          const { id: _dropId, ...rest } = saved;
          const tab = blankTab(rest);
          return {
            tabs: [...state.tabs, tab],
            activeTabId: tab.id,
            ...readTab(tab),
            response: emptyResponse(),
          };
        }),

      deleteFromCollection: (collectionId, requestId) =>
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
              : c,
          ),
        })),

      deleteCollection: (collectionId) =>
        set((state) => ({ collections: state.collections.filter((c) => c.id !== collectionId) })),
    }),
    {
      name: 'openclient.workspace.v1',
      // Persist config only. Response bodies, history and stream frames are
      // excluded: they can be large, and keeping them out of localStorage
      // protects both the memory budget and the 50 MB ceiling.
      partialize: (state) => ({
        tabs: state.tabs.map((t) => ({ ...t, grpc: { ...t.grpc, services: [] } })),
        activeTabId: state.activeTabId,
        collections: state.collections,
        environments: state.environments,
        activeEnvId: state.activeEnvId,
      }),
      storage: createJSONStorage(() => localStorage),
      // Hydration is skipped on purpose: localStorage rehydrates
      // synchronously during store creation, so the first client
      // render would differ from the server render and trip React's
      // hydration check. `WorkspacePage` calls `persist.rehydrate()`
      // in an effect instead, after the first paint.
      skipHydration: true,
      version: 2,
      /**
       * v1 stored a single flat request. Lift it into a one-tab workspace so an
       * existing install keeps its URL, headers, body and environment instead of
       * silently resetting.
       */
      migrate: (persisted) => {
        if (!persisted || Array.isArray(persisted.tabs)) return persisted;

        const { protocol, method, url, headers, body, auth, grpc } = persisted;
        return {
          ...persisted,
          tabs: [blankTab({ protocol, method, url, headers, body, auth, grpc })],
          activeTabId: '',
          collections: persisted.collections ?? [],
        };
      },
      /**
       * Zustand's default merge is a shallow spread, so the persisted `grpc`
       * object replaced the initial one wholesale. Any key `partialize` leaves
       * out — `services`, which is derived from the descriptor set and must
       * never be persisted — came back `undefined` and crashed the gRPC panel
       * on rehydrate. Merging the slice against the defaults keeps unknown or
       * newly added keys intact, and also repairs state already sitting in
       * localStorage from an earlier visit.
       */
      merge: (persisted, current) => {
        // Run even with nothing stored: `merge` is what repairs a blank
        // `activeTabId`, and a fresh install is exactly that case.
        const base = persisted ?? current;

        const tabs = Array.isArray(base.tabs) && base.tabs.length ? base.tabs : current.tabs;
        // `activeTabId` must point at a tab that exists, or every read of the live
        // request would silently fall back to a tab the user is not looking at.
        const activeTabId = tabs.some((t) => t.id === base.activeTabId)
          ? base.activeTabId
          : tabs[0].id;

        return {
          ...current,
          ...(persisted ?? {}),
          tabs,
          activeTabId,
          // The live request follows the active tab rather than the stale flat
          // copy in storage, which is what the v1 shape carried.
          ...readTab(tabs.find((t) => t.id === activeTabId) ?? tabs[0]),
          grpc: {
            ...current.grpc,
            ...(tabs.find((t) => t.id === activeTabId) ?? {}).grpc,
            services: [],
          },
        };
      },
    },
  ),
);
