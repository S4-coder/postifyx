'use client';

import React from 'react';

/**
 * Recursive, collapsible JSON tree.
 *
 * Rendering a tree instead of a flat string keeps deep payloads readable and
 * lets the user collapse noisy arrays. Rendered on demand inside a client
 * component so it stays out of the static export path.
 */

const Scalar = ({ value }) => {
  let tone = 'text-slate-300';
  if (typeof value === 'string') tone = 'text-emerald-300';
  else if (typeof value === 'number') tone = 'text-sky-300';
  else if (typeof value === 'boolean') tone = 'text-amber-300';
  else if (value === null) tone = 'text-slate-500';

  return <span className={tone}>{typeof value === 'string' ? `"${value}"` : String(value)}</span>;
};

const Node = ({ name, value, depth, isLast, defaultOpen }) => {
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  if (!isObject) {
    return (
      <div className="flex gap-2 leading-relaxed" style={{ paddingLeft: depth * 14 }}>
        {name !== null && (
          <>
            <span className="text-slate-400">{name}:</span>
            <Scalar value={value} />
          </>
        )}
      </div>
    );
  }

  const entries = isArray
    ? value.map((v, i) => [String(i), v])
    : Object.entries(value);
  const size = entries.length;
  const [open, setOpen] = React.useState(defaultOpen ?? depth < 2);

  const bracket = isArray ? ['[', ']'] : ['{', '}'];

  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-left leading-relaxed text-slate-500 hover:text-slate-300"
      >
        <span className="inline-block w-3 text-[10px] text-emerald-400">{open ? '▾' : '▸'}</span>
        {name !== null && <span className="text-slate-400">{name}:</span>}
        <span className="text-slate-500">
          {bracket[0]}
          {!open && <span className="text-slate-600"> {size} {size === 1 ? 'entry' : 'entries'} </span>}
          {open && <span className="text-slate-600"> </span>}
          {open && bracket[1]}
        </span>
      </button>

      {open &&
        entries.map(([key, child], i) => (
          <Node
            key={key}
            name={key}
            value={child}
            depth={0}
            isLast={i === entries.length - 1}
            defaultOpen={depth < 1}
          />
        ))}
    </div>
  );
};

/**
 * Attempts a JSON parse, falling back to raw text so non-JSON bodies
 * (HTML, plain text, binary-ish output) still render.
 */
export default function JsonTree({ body }) {
  let parsed = null;
  let parseFailed = false;

  if (body && body.trim()) {
    try {
      parsed = JSON.parse(body);
    } catch {
      parseFailed = true;
    }
  }

  if (parseFailed) {
    return <pre className="whitespace-pre-wrap break-words font-mono text-xs text-slate-300">{body}</pre>;
  }

  if (parsed === null) {
    return <p className="text-xs text-slate-600">Empty response body.</p>;
  }

  return (
    <div className="font-mono text-xs">
      <Node name={null} value={parsed} depth={0} defaultOpen />
    </div>
  );
}
