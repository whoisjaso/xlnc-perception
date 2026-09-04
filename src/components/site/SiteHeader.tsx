import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Wordmark } from '@/components/brand/Wordmark';
import { useFleet } from '@/store';
import { VehicleImage } from './VehicleImage';
import { cx } from '@/lib/util';
import { getLenis } from './SmoothScroll';

const NAV = [
  { to: '/fleet', label: 'The Fleet' },
  { to: '/experience', label: 'The Experience' },
  { to: '/requirements', label: 'Requirements' },
  { to: '/reserve', label: 'Reserve' },
  { to: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    // Scroll state via IntersectionObserver on a sentinel, not a scroll listener.
    const sentinel = document.getElementById('top-sentinel');
    if (!sentinel) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { rootMargin: '-40px 0px 0px 0px' });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    const lenis = getLenis();
    if (open) { lenis?.stop(); document.documentElement.style.overflow = 'hidden'; }
    else { lenis?.start(); document.documentElement.style.overflow = ''; }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header
        className={cx('fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500')}
        style={{
          background: scrolled && !open ? 'rgb(15 16 18 / 0.72)' : 'transparent',
          backdropFilter: scrolled && !open ? 'blur(18px) saturate(1.3)' : 'none',
          WebkitBackdropFilter: scrolled && !open ? 'blur(18px) saturate(1.3)' : 'none',
          borderBottom: `1px solid ${scrolled && !open ? 'var(--line)' : 'transparent'}`,
        }}
      >
        <div className="mx-auto max-w-[1600px] px-5 md:px-10 h-[72px] grid grid-cols-[1fr_auto_1fr] items-center">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="site-menu"
            className="justify-self-start inline-flex items-center gap-3 h-11 -ml-2 px-2 rounded-full group"
          >
            <span className="relative block w-6 h-3" aria-hidden>
              <span className="absolute left-0 top-0 h-px w-6 bg-current transition-transform duration-500" style={{ transform: open ? 'translateY(6px) rotate(45deg)' : 'none', transitionTimingFunction: 'var(--ease-in-out-quart)' }} />
              <span className="absolute left-0 bottom-0 h-px w-6 bg-current transition-transform duration-500" style={{ transform: open ? 'translateY(-6px) rotate(-45deg)' : 'none', transitionTimingFunction: 'var(--ease-in-out-quart)' }} />
            </span>
            <span className="label-caps hidden sm:inline">{open ? 'Close' : 'Menu'}</span>
          </button>

          <Link to="/" className="justify-self-center inline-flex items-center h-11 px-2" aria-label="Nova Wheels home">
            <Wordmark size="md" />
          </Link>

          <nav className="justify-self-end hidden md:flex items-center gap-8" aria-label="Primary">
            <Link to="/fleet" className={cx('label-caps transition-opacity hover:opacity-100', pathname.startsWith('/fleet') ? 'opacity-100' : 'opacity-70')}>Fleet</Link>
            <Link to="/reserve" className="btn btn-ghost btn-sm">Reserve</Link>
          </nav>
          <Link to="/reserve" className="justify-self-end md:hidden label-caps">Reserve</Link>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="fixed inset-0 z-40 overflow-hidden"
            initial={reduce ? { opacity: 0 } : { clipPath: 'inset(0 0 100% 0)' }}
            animate={reduce ? { opacity: 1 } : { clipPath: 'inset(0 0 0% 0)' }}
            exit={reduce ? { opacity: 0 } : { clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            style={{ background: '#0f1012' }}
          >
            <MenuContents onNavigate={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MenuContents({ onNavigate }: { onNavigate: () => void }) {
  const vehicles = useFleet((s) => s.vehicles);
  const featured = vehicles.filter((v) => v.featured);
  const [hover, setHover] = useState<number>(0);
  const reduce = useReducedMotion();
  const pick = featured[hover % Math.max(1, featured.length)] ?? vehicles[0];

  return (
    <div className="h-full mx-auto max-w-[1600px] px-5 md:px-10 pt-[72px] grid md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16">
      <nav aria-label="Menu" className="flex flex-col justify-center gap-1 md:gap-2 py-10">
        {NAV.map((item, i) => (
          <motion.div
            key={item.to}
            className="overflow-hidden"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 + i * 0.06, duration: 0.5 }}
          >
            <motion.div initial={reduce ? false : { y: '100%' }} animate={{ y: 0 }} transition={{ delay: 0.35 + i * 0.07, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
              <Link
                to={item.to}
                onClick={onNavigate}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                className="group inline-flex items-baseline gap-4 font-display text-[clamp(40px,7.5vw,104px)] leading-[1.02] tracking-[-0.01em] transition-colors duration-300"
                style={{ color: 'var(--fg)' }}
              >
                <span className="transition-transform duration-500 group-hover:translate-x-3 group-hover:italic" style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}>{item.label}</span>
                <ArrowUpRight aria-hidden weight="thin" className="size-[0.5em] opacity-0 -translate-y-2 translate-x-[-8px] transition-all duration-500 group-hover:opacity-70 group-hover:translate-y-0 group-hover:translate-x-0" />
              </Link>
            </motion.div>
          </motion.div>
        ))}
        <motion.div
          className="mt-10 flex flex-wrap gap-x-10 gap-y-3 text-[14px]"
          style={{ color: 'var(--fg-3)' }}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <a href="tel:+17135550148" className="hover:text-[var(--fg)] transition-colors">(713) 555-0148</a>
          <a href="mailto:concierge@novawheels.com" className="hover:text-[var(--fg)] transition-colors">concierge@novawheels.com</a>
          <Link to="/admin" onClick={onNavigate} className="hover:text-[var(--fg)] transition-colors">Team sign in</Link>
        </motion.div>
      </nav>

      <motion.div
        className="hidden md:flex flex-col justify-center py-10"
        initial={reduce ? false : { opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {pick && (
          <Link to={`/fleet/${pick.slug}`} onClick={onNavigate} className="group block">
            <div className="aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)]">
              <VehicleImage vehicle={pick} className="w-full h-full transition-transform duration-[1200ms] group-hover:scale-[1.04]" />
            </div>
            <div className="mt-5 flex items-baseline justify-between gap-6">
              <p className="font-display text-[26px] leading-tight">{pick.year} {pick.make} {pick.model}</p>
              <p className="label-caps whitespace-nowrap" style={{ color: 'var(--fg-3)' }}>from ${pick.rates.daily.toLocaleString()} / day</p>
            </div>
          </Link>
        )}
      </motion.div>
    </div>
  );
}
