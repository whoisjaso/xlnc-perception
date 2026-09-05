import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/util';

/** Pressure-less but smoothed signature capture. Exports PNG data URL. */
export function SignaturePad({ onChange, className, label = 'Sign here' }: { onChange: (dataUrl: string | null) => void; className?: string; label?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = getComputedStyle(c).color;
  }, []);

  const pos = (e: PointerEvent | React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: React.PointerEvent) => {
    drawing.current = true;
    last.current = pos(e);
    canvas.current?.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return;
    const ctx = canvas.current!.getContext('2d')!;
    const p = pos(e);
    const mid = { x: (last.current.x + p.x) / 2, y: (last.current.y + p.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.quadraticCurveTo(last.current.x, last.current.y, mid.x, mid.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (empty) setEmpty(false);
  };
  const up = () => {
    drawing.current = false;
    last.current = null;
    if (canvas.current && !empty) onChange(canvas.current.toDataURL('image/png'));
  };
  const clear = () => {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    ctx.clearRect(0, 0, c.width, c.height);
    setEmpty(true);
    onChange(null);
  };

  return (
    <div className={cx('relative', className)}>
      <canvas
        ref={canvas}
        role="img"
        aria-label="Signature area. Draw your signature with a finger, stylus, or mouse."
        className="w-full h-[200px] touch-none rounded-[var(--radius)] cursor-crosshair"
        style={{ background: 'var(--surface)', border: '1px solid var(--line-strong)', color: 'var(--fg)' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
      />
      {empty && <p aria-hidden className="absolute inset-0 flex items-center justify-center text-[15px] pointer-events-none" style={{ color: 'var(--fg-3)' }}>{label}</p>}
      <div aria-hidden className="absolute left-6 right-6 bottom-10 h-px pointer-events-none" style={{ background: 'var(--line-strong)' }} />
      <button type="button" onClick={clear} className="absolute top-3 right-3 text-[13px] px-3 h-8 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--fg-2)' }}>Clear</button>
    </div>
  );
}
