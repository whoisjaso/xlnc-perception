import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { cx } from '@/lib/util';

/* Button */
type BtnVariant = 'primary' | 'accent' | 'ghost' | 'quiet';
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean }>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      className={cx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cx('inline-block size-4 rounded-full border-2 border-current border-r-transparent', className)}
      style={{ animation: 'spin 0.7s linear infinite' }}
    />
  );
}

/* Text input, line style (wizard) */
export const LineInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(({ invalid, className, ...rest }, ref) => (
  <input ref={ref} className={cx('field', className)} aria-invalid={invalid || undefined} {...rest} />
));
LineInput.displayName = 'LineInput';

/* Boxed input (admin forms) */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(({ invalid, className, ...rest }, ref) => (
  <input ref={ref} className={cx('field-box', className)} aria-invalid={invalid || undefined} {...rest} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...rest }, ref) => (
  <textarea ref={ref} className={cx('field-box min-h-28 resize-y', className)} {...rest} />
));
Textarea.displayName = 'Textarea';

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cx('field-box', className)} {...rest}>
        {children}
      </select>
      <CaretDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4" style={{ color: 'var(--fg-3)' }} />
    </div>
  );
}

/* Field wrapper */
export function Field({ label, hint, error, required, children, htmlFor }: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium" style={{ color: 'var(--fg-2)' }}>
        {label}
        {required ? <span aria-hidden className="ml-1" style={{ color: 'var(--color-danger)' }}>*</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-[13px]" style={{ color: 'var(--color-danger)' }}>{error}</p>
      ) : hint ? (
        <p className="text-[13px]" style={{ color: 'var(--fg-3)' }}>{hint}</p>
      ) : null}
    </div>
  );
}

/* Toggle */
export function Toggle({ checked, onChange, label, description, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; id?: string }) {
  return (
    <label htmlFor={id} className="flex items-start justify-between gap-6 py-3 cursor-pointer">
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-medium">{label}</span>
        {description ? <span className="text-[13px]" style={{ color: 'var(--fg-3)' }}>{description}</span> : null}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative shrink-0 h-7 w-12 rounded-full transition-colors duration-200"
        style={{ background: checked ? 'var(--accent)' : 'var(--line-strong)' }}
      >
        <span
          aria-hidden
          className="absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow-sm transition-transform duration-300"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)', transitionTimingFunction: 'var(--ease-out-expo)' }}
        />
      </button>
    </label>
  );
}

/* Segmented control */
export function Segmented<T extends string>({ value, onChange, options, ariaLabel }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; ariaLabel: string }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex p-1 rounded-full" style={{ background: 'var(--surface-2)' }}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className="px-4 h-9 rounded-full text-[13px] font-medium transition-all duration-200"
          style={{ background: value === o.value ? 'var(--surface)' : 'transparent', color: value === o.value ? 'var(--fg)' : 'var(--fg-3)', boxShadow: value === o.value ? 'var(--shadow-1)' : 'none' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* Status pill */
export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'accent' }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: 'var(--surface-2)', fg: 'var(--fg-2)' },
    ok: { bg: 'color-mix(in oklab, var(--color-ok) 14%, transparent)', fg: 'var(--color-ok)' },
    warn: { bg: 'color-mix(in oklab, var(--color-warn) 16%, transparent)', fg: 'var(--color-warn)' },
    danger: { bg: 'color-mix(in oklab, var(--color-danger) 14%, transparent)', fg: 'var(--color-danger)' },
    accent: { bg: 'color-mix(in oklab, var(--accent) 14%, transparent)', fg: 'var(--accent)' },
  };
  const c = colors[tone];
  return (
    <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium whitespace-nowrap" style={{ background: c.bg, color: c.fg }}>
      {children}
    </span>
  );
}

/* Empty state */
export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 py-16 max-w-md">
      <p className="text-[19px] font-medium">{title}</p>
      {body ? <p className="text-[15px]" style={{ color: 'var(--fg-3)' }}>{body}</p> : null}
      {action}
    </div>
  );
}

/* Money input */
export function MoneyInput({ value, onChange, className, big, ...rest }: { value: number; onChange: (n: number) => void; big?: boolean } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div className="relative">
      <span aria-hidden className={cx('absolute left-0 top-1/2 -translate-y-1/2', big ? 'text-[28px]' : 'text-[15px] left-3')} style={{ color: 'var(--fg-3)' }}>$</span>
      <input
        type="text"
        inputMode="decimal"
        className={cx(big ? 'field pl-7 text-[40px] tabular' : 'field-box pl-7 tabular', className)}
        value={value ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : ''}
        onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
        {...rest}
      />
    </div>
  );
}
