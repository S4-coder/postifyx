'use client';

import { useEffect } from 'react';

/**
 * Subtle cursor effect: an instant emerald dot plus a slower
 * trailing ring. Only rendered for precise pointers (mouse),
 * never on touch. The native cursor stays visible for usability.
 */
export default function CursorEffect() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring) return;

    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    let raf = 0;
    let visible = false;

    const show = () => {
      visible = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    };
    const hide = () => {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };
    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) show();
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform =
        `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform =
        `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', hide);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', hide);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        id="cursor-dot"
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-emerald-400 opacity-0 transition-opacity duration-200"
      />
      <div
        id="cursor-ring"
        className="pointer-events-none fixed left-0 top-0 z-[99] h-8 w-8 rounded-full border border-emerald-400/50 opacity-0 transition-opacity duration-200"
      />
    </>
  );
}
