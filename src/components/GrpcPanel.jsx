'use client';

import { useRequestStore } from '@/store/useRequestStore';
import { isDesktop } from '@/lib/tauri';

/**
 * gRPC call configuration.
 *
 * gRPC needs more than a URL: a descriptor set (so the message shape is known),
 * a service and method, and a JSON request body. The service/method pair is a
 * picker populated from the descriptor set, which is why the set must be
 * supplied before those fields are useful.
 */
export default function GrpcPanel() {
  const grpc = useRequestStore((s) => s.grpc);
  const setGrpc = useRequestStore((s) => s.setGrpc);
  const addGrpcMetadata = useRequestStore((s) => s.addGrpcMetadata);
  const updateGrpcMetadata = useRequestStore((s) => s.updateGrpcMetadata);
  const removeGrpcMetadata = useRequestStore((s) => s.removeGrpcMetadata);
  const describeGrpcServices = useRequestStore((s) => s.describeGrpcServices);

  // `services` is derived state and is deliberately not persisted, so it can be
  // absent on the first render after a rehydrate. Defaulting here keeps a stale
  // or truncated localStorage entry from white-screening the whole workspace.
  const services = grpc.services ?? [];

  const selectedService = services.find((s) => s.name === grpc.service) ?? services[0];

  return (
    <div className="h-full overflow-auto p-3">
      {!isDesktop() && (
        <div className="mb-3 rounded border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs leading-relaxed text-amber-200/90">
          Browsers cannot speak HTTP/2 gRPC: the protocol needs trailers and
          server push that <code className="font-mono">fetch</code> does not expose. Launch the
          PostifyX desktop app to run this call.
        </div>
      )}

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
            Descriptor set (base64)
          </span>
          <textarea
            value={grpc.descriptorSet}
            onChange={(e) => setGrpc({ descriptorSet: e.target.value })}
            onBlur={describeGrpcServices}
            placeholder={'Generate with:\nprotoc --descriptor_set_out=api.bin api.proto\nbase64 -w0 api.bin'}
            spellCheck={false}
            rows={3}
            className="w-full resize-y rounded border border-[#2a2a2a] bg-[#0d0d0d] p-2 font-mono text-[11px] text-slate-200 focus:border-sky-500 focus:outline-none"
          />
          <span className="mt-1 block text-[10px] text-slate-600">
            PostifyX uses dynamic protobuf reflection, so no generated code or protoc plugin is
            needed at build time.
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
              Service
            </span>
            <select
              value={grpc.service}
              onChange={(e) => {
                const next = services.find((s) => s.name === e.target.value);
                setGrpc({ service: e.target.value, method: '' });
                if (next?.methods?.length) setGrpc({ method: next.methods[0].name });
              }}
              disabled={services.length === 0}
              className="oc-select w-full"
            >
              {services.length === 0 && <option value="">No descriptor loaded</option>}
              {services.map((service) => (
                <option key={service.name} value={service.name}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
              Method
            </span>
            <select
              value={grpc.method}
              onChange={(e) => setGrpc({ method: e.target.value })}
              disabled={!selectedService}
              className="oc-select w-full"
            >
              {!selectedService && <option value="">No methods</option>}
              {selectedService?.methods?.map((method) => (
                <option key={method.name} value={method.name} disabled={method.serverStreaming}>
                  {method.name}
                  {method.serverStreaming ? ' (streaming, unsupported)' : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedService && (
          <p className="text-[10px] text-slate-600">
            {grpc.method && selectedService.methods.find((m) => m.name === grpc.method)
              ? (() => {
                  const m = selectedService.methods.find((x) => x.name === grpc.method);
                  return `${grpc.method}(${m.input}) returns (${m.output})`;
                })()
              : 'Pick a method to see its signature.'}
          </p>
        )}

        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-slate-500">
            Request message (JSON)
          </span>
          <textarea
            value={grpc.message}
            onChange={(e) => setGrpc({ message: e.target.value })}
            placeholder='{\n  "name": "world"\n}'
            spellCheck={false}
            rows={4}
            className="w-full resize-y rounded border border-[#2a2a2a] bg-[#0d0d0d] p-2 font-mono text-[11px] text-slate-200 focus:border-sky-500 focus:outline-none"
          />
        </label>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-slate-500">Metadata</span>
            <button type="button" onClick={addGrpcMetadata} className="text-xs text-sky-400 hover:text-sky-300">
              + Add
            </button>
          </div>

          <div className="space-y-1">
            {(grpc.metadata ?? []).map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={row.key}
                  onChange={(e) => updateGrpcMetadata(i, { key: e.target.value })}
                  placeholder="key"
                  spellCheck={false}
                  className="flex-1 rounded border border-[#1e1e1e] bg-[#0d0d0d] px-2 py-1 font-mono text-[11px] text-slate-200 focus:border-sky-500 focus:outline-none"
                />
                <input
                  value={row.value}
                  onChange={(e) => updateGrpcMetadata(i, { value: e.target.value })}
                  placeholder="value"
                  spellCheck={false}
                  className="flex-1 rounded border border-[#1e1e1e] bg-[#0d0d0d] px-2 py-1 font-mono text-[11px] text-slate-300 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeGrpcMetadata(i)}
                  className="text-slate-600 hover:text-rose-400"
                  aria-label="Remove metadata"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={grpc.insecure}
            onChange={(e) => setGrpc({ insecure: e.target.checked })}
            className="h-3.5 w-3.5 accent-sky-500"
          />
          Use plaintext HTTP/2 (local servers only)
        </label>
      </div>
    </div>
  );
}
