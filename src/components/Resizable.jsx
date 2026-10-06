'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Draggable split, the way a code editor lets you move a pane edge.
 *
 * Pointer Events are used rather than mouse events so the same code drives a
 * mouse, a trackpad, a touch drag, and the Tauri webview without a branch.
 *
 * While a drag is in flight the handle sets `pointercapture` and marks the
 * document `user-select: none`. Without that, the drag selects the text it moves
 * across, which makes the pane feel like it is fighting the cursor.
 *
 * The size is a pixel value rather than a percentage because panes contain text
 * and code: a fixed pixel height keeps line wrapping stable while dragging.
 */
export function useResizable({
  axis = 'y',
  initial = 320,
  min = 120,
  max = 1600,
  invert = false,
  storageKey,
}) {
  const [size, setSize] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const frame = useRef(null);

  // Restore a saved layout, but only if it is still within the current bounds —
  // a window resize can leave a stored height larger than the viewport.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = Number(window.localStorage.getItem(storageKey));
      if (Number.isFinite(stored) && stored > 0) {
        setSize(Math.min(Math.max(stored, min), Math.max(min, window.innerHeight - 80)));
      }
    } catch {
      /* storage unavailable: keep the default size */
    }
  }, [storageKey, min]);

  const persist = useCallback(
    (value) => {
      if (!storageKey) return;
      try {
        window.localStorage.setItem(storageKey, String(Math.round(value)));
      } catch {
        /* storage unavailable: the layout simply will not persist */
      }
    },
    [storageKey],
  );

  const onPointerDown = useCallback(
    (event) => {
      event.preventDefault();
      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);
      setDragging(true);

      const startPos = axis === 'y' ? event.clientY : event.clientX;
      const startSize = size;

      const onMove = (moveEvent) => {
        const current = axis === 'y' ? moveEvent.clientY : moveEvent.clientX;
        const delta = current - startPos;

        // `invert` puts the drag on the other side of the handle, which is what
        // a divider between a top and a bottom pane needs.
        const next = Math.min(Math.max(startSize + (invert ? -delta : delta), min), max);
        setSize(next);
      };

      const onUp = () => {
        handle.releasePointerCapture?.(event.pointerId);
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
        handle.removeEventListener('pointercancel', onUp);
        setDragging(false);
        setSize((final) => {
          persist(final);
          return final;
        });
      };

      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
    },
    [axis, size, min, max, invert, persist],
  );

  // Cursor and text selection follow the drag axis, so the pointer never looks
  // like it is pointing at nothing.
  useEffect(() => {
    if (!dragging) return undefined;

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    return () => {
      document.body.style.userSelect = previousUserSelect;
    };
  }, [dragging]);

  // Double-click restores the default, matching editor convention.
  const onDoubleClick = useCallback(() => {
    setSize(initial);
    persist(initial);
  }, [initial, persist]);

  const cursor = axis === 'y' ? (invert ? 'row-resize' : 'row-resize') : 'col-resize';

  return {
    size,
    dragging,
    handleProps: {
      onPointerDown,
      onDoubleClick,
      style: { cursor, touchAction: 'none' },
      role: 'separator',
      'aria-orientation': axis === 'y' ? 'horizontal' : 'vertical',
    },
  };
}

/**
 * A pane plus its drag handle.
 *
 * `axis="y"` stacks the handle horizontally, so the pane height changes.
 * `axis="x"` stacks it vertically, so the pane width changes.
 */
export default function ResizablePane({
  axis = 'y',
  initial = 320,
  min = 120,
  max = 1600,
  invert = false,
  storageKey,
  children,
  className = '',
  paneClassName = '',
}) {
  const { size, dragging, handleProps } = useResizable({
    axis,
    initial,
    min,
    max,
    invert,
    storageKey,
  });

  return (
    <div
      className={['flex min-h-0 min-w-0', axis === 'y' ? 'flex-col' : 'flex-row', className].join(' ')}
    >
      <div
        className={['min-h-0 min-w-0 overflow-hidden', paneClassName].join(' ')}
        style={axis === 'y' ? { height: size, flex: 'none' } : { width: size, flex: 'none' }}
      >
        {children}
      </div>

      {/* The hit area is wider than the visible line, otherwise grabbing a 1px
          divider with a mouse is needlessly precise. */}
      <div
        {...handleProps}
        title="Drag to resize · double-click to reset"
        className={[
          'group relative z-10 shrink-0 transition-colors',
          axis === 'y' ? 'h-2.5 cursor-row-resize' : 'w-2.5 cursor-col-resize',
          dragging
            ? 'bg-emerald-500/60'
            : 'bg-[#2a2a2a]/60 hover:bg-emerald-500/40',
        ].join(' ')}
      >
        <span
          className={[
            'absolute transition-opacity',
            axis === 'y' ? 'inset-x-0 top-0 h-px' : 'inset-y-0 left-0 w-px',
            dragging ? 'opacity-0' : 'bg-[#2a2a2a] group-hover:opacity-0',
          ].join(' ')}
        />
      </div>
    </div>
  );
}
