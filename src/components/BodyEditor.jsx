'use client';

import { BODY_FORMATS, countStats, formatBody, getBodyFormat } from '@/lib/bodyFormats';
import { useRequestStore } from '@/store/useRequestStore';

const PLACEHOLDER = {
  json: '{\n  "key": "value"\n}',
  xml: '<note>\n  <body>hello</body>\n</note>',
  javascript: 'const payload = { key: "value" };\nreturn payload;',
  html: '<div class="card">\n  <h1>hello</h1>\n</div>',
  text: 'Plain text payload',
};

/**
 * Body editor with a payload format selector.
 *
 * The format decides two things: the placeholder and validation shown in the
 * status bar, and the `Content-Type` the request advertises (handled by
 * `setBodyFormat` in the store, so headers and editor cannot disagree).
 *
 * The bytes on the wire are always the literal editor text — nothing is
 * serialised for the user, because the user is writing the body by hand.
 */
export default function BodyEditor() {
  const body = useRequestStore((s) => s.body);
  const bodyFormat = useRequestStore((s) => s.bodyFormat);
  const setBody = useRequestStore((s) => s.setBody);
  const setBodyFormat = useRequestStore((s) => s.setBodyFormat);

  const active = getBodyFormat(bodyFormat);
  const stats = countStats(body);

  let validity = { ok: true, message: 'Empty body' };
  if (body.trim()) {
    const check = formatBody(body, bodyFormat);
    validity = check.error
      ? { ok: false, message: check.error }
      : { ok: true, message: `Valid ${active.label}` };
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[#1e1e1e] px-3 py-1.5">
        <div className="flex items-center gap-1" role="group" aria-label="Body format">
          {BODY_FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              onClick={() => setBodyFormat(format.id)}
              aria-pressed={format.id === bodyFormat}
              title={format.contentType}
              className={[
                'rounded px-2 py-0.5 text-[11px] font-medium transition',
                format.id === bodyFormat
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-slate-500 hover:bg-[#1a1a1a] hover:text-slate-300',
              ].join(' ')}
            >
              {format.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[10px] text-slate-600 sm:inline">
            {active.contentType}
          </span>
          <span className="text-[10px] text-slate-600">
            {stats.lines} ln · {stats.bytes} B
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#1e1e1e] px-3 py-1">
        <p className={`text-[11px] ${validity.ok ? 'text-slate-500' : 'text-amber-400'}`}>
          {validity.message}
        </p>
        <button
          type="button"
          onClick={() => {
            const result = formatBody(body, bodyFormat);
            if (result.error || result.text !== body) setBody(result.text);
          }}
          disabled={!body.trim()}
          className="text-[11px] text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
          title={`Re-indent as ${active.label}`}
        >
          Format
        </button>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={PLACEHOLDER[bodyFormat] ?? PLACEHOLDER.text}
        spellCheck={false}
        className="flex-1 resize-none bg-[#0d0d0d] p-3 font-mono text-xs leading-relaxed text-slate-200 focus:outline-none"
      />
    </div>
  );
}
