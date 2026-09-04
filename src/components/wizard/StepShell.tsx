import { useEffect, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { advanceTone, errorTone, keyClick } from '@/lib/sound';
import { cx } from '@/lib/util';

/**
 * One decision per screen. Nothing else on the page.
 * Enter advances, Escape/Back goes back, every keystroke gets a tactile click.
 */
export function StepShell({
  title, subtitle, children, onNext, onBack, nextLabel = 'Continue', canNext = true, progress, hint, footer, wide, skipLabel, onSkip, error,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  canNext?: boolean;
  progress?: number; // 0..1
  hint?: string;
  footer?: ReactNode;
  wide?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
  error?: string | null;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inTextarea = target.tagName === 'TEXTAREA';
      if (e.key === 'Enter' && !inTextarea && !e.shiftKey && !e.metaKey && !e.ctrlKey && target.tagName !== 'BUTTON' && target.getAttribute('role') !== 'listbox') {
        if (target.getAttribute('aria-expanded') === 'true') return; // let comboboxes handle Enter
        e.preventDefault();
        if (canNext && onNext) { advanceTone(); onNext(); } else errorTone();
        return;
      }
      if (e.key === 'Escape' && onBack) { onBack(); return; }
      if (e.key.length === 1) keyClick(e.key === ' ' ? 'space' : 'key');
      else if (e.key === 'Backspace' || e.key === 'Delete') keyClick('delete');
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [canNext, onNext, onBack]);

  useEffect(() => {
    // Focus the first control so typing starts immediately.
    const t = setTimeout(() => {
      const first = ref.current?.querySelector<HTMLElement>('input:not([type=hidden]), textarea, select, [data-autofocus], button[aria-pressed], button[role=radio]');
      first?.focus({ preventScroll: true });
    }, 120);
    return () => clearTimeout(t);
  }, [title]);

  return (
    <div ref={ref} className="min-h-[100dvh] flex flex-col" style={{ background: 'var(--bg)' }}>
      {typeof progress === 'number' && (
        <div className="fixed top-0 inset-x-0 h-0.5 z-30" style={{ background: 'var(--line)' }} aria-hidden>
          <motion.div className="h-full origin-left" style={{ background: 'var(--accent)' }} animate={{ scaleX: Math.max(0.02, progress) }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
        </div>
      )}
      <div className="flex items-center justify-between px-5 md:px-10 h-16">
        {onBack ? (
          <button onClick={onBack} className="inline-flex items-center gap-2 h-10 px-3 -ml-3 rounded-full text-[14px] font-medium transition-colors hover:bg-[var(--surface-2)]" style={{ color: 'var(--fg-2)' }}>
            <ArrowLeft aria-hidden className="size-4" /> Back
          </button>
        ) : <span />}
        {onSkip && (
          <button onClick={onSkip} className="h-10 px-3 rounded-full text-[14px] font-medium transition-colors hover:bg-[var(--surface-2)]" style={{ color: 'var(--fg-3)' }}>{skipLabel ?? 'Skip'}</button>
        )}
      </div>

      <motion.div
        key={title}
        className={cx('flex-1 flex flex-col justify-center mx-auto w-full px-5 md:px-10 py-8', wide ? 'max-w-[1100px]' : 'max-w-[760px]')}
        initial={reduce ? false : { opacity: 0, y: 16, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-display font-normal text-[clamp(32px,4.6vw,52px)] leading-[1.06] tracking-[-0.01em] text-balance">{title}</h1>
        {subtitle && <p className="mt-3 text-[16px] md:text-[17px] leading-relaxed max-w-[56ch]" style={{ color: 'var(--fg-2)' }}>{subtitle}</p>}
        {children && <div className="mt-10">{children}</div>}
        {error && <p role="alert" className="mt-4 text-[14px]" style={{ color: 'var(--color-danger)' }}>{error}</p>}
        {(onNext || footer) && (
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {onNext && (
              <button onClick={() => { advanceTone(); onNext(); }} disabled={!canNext} className="btn btn-accent btn-lg">
                {nextLabel} <ArrowRight aria-hidden className="size-4" />
              </button>
            )}
            {footer}
            {onNext && <span className="hidden md:inline-flex items-center gap-2 text-[13px]" style={{ color: 'var(--fg-3)' }}>{hint ?? 'press'} <kbd className="kbd">Enter ↵</kbd></span>}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/** Yes / No tiles for binary questions. Arrow keys move, Enter confirms. */
export function YesNo({ value, onChange, yes = 'Yes', no = 'No', yesHint, noHint }: { value: boolean | null; onChange: (v: boolean) => void; yes?: string; no?: string; yesHint?: string; noHint?: string }) {
  return (
    <div role="radiogroup" className="grid sm:grid-cols-2 gap-3">
      {[[true, yes, yesHint], [false, no, noHint]].map(([v, label, hint]) => (
        <button key={String(v)} role="radio" aria-checked={value === v} className="tile" onClick={() => onChange(v as boolean)} data-autofocus={v === true ? '' : undefined}>
          <span className="text-[20px] font-medium">{label as string}</span>
          {hint ? <span className="text-[14px]" style={{ color: 'var(--fg-3)' }}>{hint as string}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Choice<T extends string>({ value, onChange, options, columns = 2 }: { value: T | undefined; onChange: (v: T) => void; options: { value: T; label: string; hint?: string; badge?: string; disabled?: boolean }[]; columns?: 1 | 2 | 3 }) {
  return (
    <div role="radiogroup" className={cx('grid gap-3', columns === 2 && 'sm:grid-cols-2', columns === 3 && 'sm:grid-cols-3')}>
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} disabled={o.disabled} className="tile disabled:opacity-40" onClick={() => onChange(o.value)}>
          <span className="flex items-center justify-between gap-3">
            <span className="text-[18px] font-medium">{o.label}</span>
            {o.badge && <span className="text-[11px] font-medium uppercase tracking-[0.12em] px-2 h-5 inline-flex items-center rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--fg-3)' }}>{o.badge}</span>}
          </span>
          {o.hint && <span className="text-[14px] leading-snug" style={{ color: 'var(--fg-3)' }}>{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}
