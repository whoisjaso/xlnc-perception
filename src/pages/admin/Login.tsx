import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { Wordmark } from '@/components/brand/Wordmark';
import { Button, Field, Input } from '@/components/ui';
import { DEMO_EMAIL, DEMO_PASSWORD, useAuth } from '@/store';
import { supabaseEnabled } from '@/lib/supabase';
import { errorTone, keyClick } from '@/lib/sound';

export function Login() {
  const user = useAuth((s) => s.user);
  const signIn = useAuth((s) => s.signIn);
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState(supabaseEnabled ? '' : DEMO_EMAIL);
  const [password, setPassword] = useState(supabaseEnabled ? '' : DEMO_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reduce = useReducedMotion();

  if (user) return <Navigate to={loc.state?.from ?? '/admin'} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn(email, password);
    setBusy(false);
    if (!res.ok) { setError(res.error); errorTone(); return; }
    nav(loc.state?.from ?? '/admin', { replace: true });
  };

  return (
    <div className="world-admin min-h-[100dvh] grid md:grid-cols-[1.1fr_1fr]" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <div className="hidden md:flex relative overflow-hidden flex-col justify-between p-12" style={{ background: '#0f1012', color: '#f4f2ee' }}>
        <Wordmark size="md" />
        <motion.p
          className="font-display text-[clamp(36px,4.2vw,64px)] leading-[1.05] max-w-[14ch]"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Every rental, handled in one sitting.
        </motion.p>
        <p className="text-[13px]" style={{ color: 'rgb(244 242 238 / 0.5)' }}>Nova Wheels operations</p>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.form
          onSubmit={submit}
          onKeyDown={(e) => { if (e.key.length === 1) keyClick(); }}
          className="w-full max-w-[400px] flex flex-col gap-6"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="md:hidden mb-2"><Wordmark size="md" /></div>
          <div>
            <h1 className="font-display text-[34px] leading-tight">Sign in</h1>
            <p className="mt-2 text-[15px]" style={{ color: 'var(--fg-3)' }}>Team access only.</p>
          </div>
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p role="alert" className="text-[14px]" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <Button type="submit" variant="accent" size="lg" loading={busy}>Continue</Button>
          {!supabaseEnabled && (
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--fg-3)' }}>
              Local mode. Sign in with <span className="font-medium" style={{ color: 'var(--fg-2)' }}>{DEMO_EMAIL}</span> and <span className="font-medium" style={{ color: 'var(--fg-2)' }}>{DEMO_PASSWORD}</span>. Connect Supabase in .env to use real accounts.
            </p>
          )}
        </motion.form>
      </div>
    </div>
  );
}
