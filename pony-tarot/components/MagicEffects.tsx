'use client';
import { useEffect, useRef } from 'react';

type Spark = { x: number; y: number; vx: number; vy: number; born: number; duration: number; size: number; hue: number; ring?: boolean };

export function MagicEffects({ enabled }: { enabled: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const surface = canvas.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!surface || !enabled || reduced.matches) return;
    const context = surface.getContext('2d');
    if (!context) return;
    let width = 0, height = 0, frame = 0, lastMove = 0;
    let sparks: Spark[] = [];
    const resize = () => {
      width = window.innerWidth; height = window.innerHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * scale); surface.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
    };
    const draw = (now: number) => {
      frame = 0;
      context.clearRect(0, 0, width, height);
      sparks = sparks.filter(s => now - s.born < s.duration);
      for (const s of sparks) {
        const progress = (now - s.born) / s.duration;
        const ease = 1 - (1 - progress) ** 3;
        const x = s.x + s.vx * ease, y = s.y + s.vy * ease - progress * 12;
        context.globalAlpha = (1 - progress) ** 2;
        context.strokeStyle = `hsl(${s.hue} 85% 78%)`;
        context.fillStyle = `hsl(${s.hue} 90% 86%)`;
        context.lineWidth = s.ring ? 1 : 1.2;
        context.beginPath();
        if (s.ring) context.ellipse(s.x, s.y, 8 + ease * 36, 8 + ease * 36, 0, 0, Math.PI * 2);
        else {
          const size = s.size * (1 - progress * .5);
          context.moveTo(x - size, y); context.lineTo(x + size, y);
          context.moveTo(x, y - size); context.lineTo(x, y + size);
        }
        context.stroke();
        if (!s.ring) { context.beginPath(); context.arc(x, y, 1.2, 0, Math.PI * 2); context.fill(); }
      }
      context.globalAlpha = 1;
      if (sparks.length) frame = requestAnimationFrame(draw);
    };
    const add = (x: number, y: number, count: number, burst: boolean) => {
      if (document.hidden || reduced.matches) return;
      const now = performance.now();
      for (let i = 0; i < count; i++) {
        const angle = i / count * Math.PI * 2 + Math.random() * .5;
        const distance = burst ? 22 + Math.random() * 40 : 4 + Math.random() * 18;
        sparks.push({ x, y, vx: Math.cos(angle) * distance, vy: Math.sin(angle) * distance, born: now, duration: burst ? 1000 : 600, size: burst ? 3 + Math.random() * 4 : 1 + Math.random() * 2, hue: Math.random() > .35 ? 40 : 270 });
      }
      if (burst) sparks.push({ x, y, vx: 0, vy: 0, born: now, duration: 750, size: 1, hue: 40, ring: true });
      sparks = sparks.slice(-140);
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const editable = (target: EventTarget | null) => target instanceof Element && !!target.closest('input,textarea,select,[contenteditable="true"]');
    // Inside a dialog with transform animations the fixed canvas is relative to the
    // dialog box, not the viewport; map pointer coords through its live rect.
    const toCanvas = (clientX: number, clientY: number) => {
      const rect = surface.getBoundingClientRect();
      const scaleX = rect.width ? width / rect.width : 1;
      const scaleY = rect.height ? height / rect.height : 1;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };
    const down = (event: PointerEvent) => {
      if (!editable(event.target) && event.isPrimary) { const p = toCanvas(event.clientX, event.clientY); add(p.x, p.y, event.pointerType === 'touch' ? 6 : 12, true); }
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || editable(event.target) || performance.now() - lastMove < 28) return;
      lastMove = performance.now();
      const p = toCanvas(event.clientX, event.clientY);
      add(p.x, p.y, event.buttons & 1 ? 4 : 1, false);
    };
    const clear = () => { sparks = []; cancelAnimationFrame(frame); frame = 0; context.clearRect(0, 0, width, height); };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('visibilitychange', clear);
    reduced.addEventListener('change', clear);
    return () => { clear(); window.removeEventListener('resize', resize); window.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); document.removeEventListener('visibilitychange', clear); reduced.removeEventListener('change', clear); };
  }, [enabled]);
  return enabled ? <canvas ref={canvas} className="magic-effects" aria-hidden="true"/> : null;
}
