import { cx } from '@/lib/util';

export function Wordmark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = { sm: 'text-[15px] tracking-[0.32em]', md: 'text-[17px] tracking-[0.34em]', lg: 'text-[26px] tracking-[0.36em]', xl: 'text-[clamp(40px,8vw,120px)] tracking-[0.3em]' };
  return (
    <span className={cx('font-display font-medium uppercase leading-none select-none', sizes[size], className)} aria-label="Nova Wheels">
      Nova<span className="mx-[0.25em]" style={{ color: 'var(--accent-ink)' }} aria-hidden>·</span>Wheels
    </span>
  );
}

export function Monogram({ className }: { className?: string }) {
  return (
    <span className={cx('font-display font-semibold leading-none select-none', className)} aria-hidden>
      N
    </span>
  );
}
