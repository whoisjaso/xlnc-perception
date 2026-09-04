import { useEffect } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SquaresFour, SignOut } from '@phosphor-icons/react';
import { Wordmark } from '@/components/brand/Wordmark';
import { useAuth, useSettings } from '@/store';

/** Authenticated shell. No sidebar: a thin bar and the task itself. */
export function AdminLayout() {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const settings = useSettings((s) => s.settings);
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  if (!user) return <Navigate to="/admin/login" replace state={{ from: pathname }} />;
  if (!settings.onboarded && pathname !== '/admin/onboarding') return <Navigate to="/admin/onboarding" replace />;

  const immersive = pathname.startsWith('/admin/rental/new') || pathname === '/admin/onboarding';

  return (
    <div className="world-admin min-h-[100dvh]" data-theme={settings.theme === 'system' ? undefined : settings.theme} style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <a href="#admin-main" className="skip-link">Skip to content</a>
      {!immersive && (
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-5 md:px-10" style={{ background: 'color-mix(in oklab, var(--bg) 82%, transparent)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--line)' }}>
          <Link to="/admin" className="inline-flex items-center gap-3">
            <Wordmark size="sm" />
          </Link>
          <nav className="flex items-center gap-1" aria-label="Admin">
            <Link to="/admin" className="inline-flex items-center gap-2 h-9 px-3 rounded-full text-[13px] font-medium transition-colors hover:bg-[var(--surface-2)]" style={{ color: 'var(--fg-2)' }}>
              <SquaresFour aria-hidden className="size-4" /> Hub
            </Link>
            <button onClick={() => void signOut()} className="inline-flex items-center gap-2 h-9 px-3 rounded-full text-[13px] font-medium transition-colors hover:bg-[var(--surface-2)]" style={{ color: 'var(--fg-2)' }}>
              <SignOut aria-hidden className="size-4" /> {user.name}
            </button>
          </nav>
        </header>
      )}
      <main id="admin-main">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={immersive ? 'immersive' : pathname}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
      <div>
        <h1 className="font-display text-[clamp(30px,4vw,44px)] leading-[1.05]">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px]" style={{ color: 'var(--fg-3)' }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? 'mx-auto max-w-[1400px] px-5 md:px-10 py-10' : 'mx-auto max-w-[1100px] px-5 md:px-10 py-10'}>{children}</div>;
}
