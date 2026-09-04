import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, ShieldCheck } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { Wordmark } from '@/components/brand/Wordmark';
import { SignaturePad } from '@/components/wizard/SignaturePad';
import { ContractDoc } from '@/components/admin/ContractDoc';
import { useCustomers, useFleet, useRentals, useSettings, useTemplates } from '@/store';
import { activeClauses, buildTokens, fill } from '@/lib/contract';
import { fullName, money, nowIso, uid } from '@/lib/util';
import { successChord, tick } from '@/lib/sound';

type Stage = 'welcome' | 'money' | 'rules' | 'full' | 'sign' | 'done' | 'expired';

/**
 * Client-side signing funnel. Opened from the link the operator sends.
 * Renter reads the money terms one at a time, initials each, sees the full agreement, signs.
 */
export function Sign() {
  const { token } = useParams();
  const rentals = useRentals();
  const fleet = useFleet((s) => s.vehicles);
  const customers = useCustomers((s) => s.customers);
  const settings = useSettings((s) => s.settings);
  const templates = useTemplates();
  const r = rentals.byToken(token ?? '');
  const v = r ? fleet.find((x) => x.id === r.vehicleId) : undefined;
  const c = r ? customers.find((x) => x.id === r.customerId) : undefined;
  const alreadySigned = r?.signatures.some((s) => s.role === 'renter');
  const expired = r?.signingExpiresAt ? new Date(r.signingExpiresAt) < new Date() : false;
  const [stage, setStage] = useState<Stage>(alreadySigned ? 'done' : expired ? 'expired' : 'welcome');
  const [idx, setIdx] = useState(0);
  const [initials, setInitials] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [sig, setSig] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (r && !r.timeline.some((e) => e.type === 'viewed-by-renter')) rentals.log(r.id, { type: 'viewed-by-renter', summary: `Renter opened the signing link (${navigator.userAgent.split(') ')[0].split('(')[1] ?? 'browser'})` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r?.id]);

  const ctx = useMemo(() => (r && v && c ? { rental: r, vehicle: v, customer: c, company: settings, template: templates.byId(r.contract?.templateId ?? '') ?? templates.getDefault() } : null), [r, v, c, settings, templates]);
  const tokens = useMemo(() => (ctx ? buildTokens(ctx) : {}), [ctx]);
  const clauses = useMemo(() => (ctx ? activeClauses(ctx.template, ctx.rental) : []), [ctx]);
  const moneyClauses = clauses.filter((x) => x.category === 'money' || x.id === 'term');
  const ruleClauses = clauses.filter((x) => x.category === 'use' || x.category === 'damage' || x.category === 'tech');

  if (!r || !v || !c || !ctx) {
    return <Shell><p className="font-display text-[32px]">This signing link is not valid.</p><p className="mt-3" style={{ color: 'var(--fg-2)' }}>Ask {settings.dba} to send a new one.</p></Shell>;
  }

  const expectedInitials = `${c.firstName[0] ?? ''}${c.lastName[0] ?? ''}`.toUpperCase();
  const initialsOk = (id: string) => (initials[id] ?? '').trim().toUpperCase() === expectedInitials;
  const q = { total: r.installments.reduce((s, i) => s + i.amount, 0) };

  const finish = () => {
    if (!sig || !consent) return;
    const at = nowIso();
    rentals.patch(r.id, (x) => ({
      ...x,
      status: x.signatures.some((s) => s.role === 'dealer') ? 'signed' : 'awaiting-signature',
      signatures: [...x.signatures, { role: 'renter', name: fullName(c), dataUrl: sig, signedAt: at, method: 'remote-link', consentToElectronicRecords: true, userAgent: navigator.userAgent }],
      timeline: [...x.timeline, { id: uid('ev'), at, type: 'signed-renter', summary: `Renter signed remotely. Initialed ${Object.keys(initials).length} sections.` }],
    }));
    successChord();
    setStage('done');
  };

  const variants = { enter: reduce ? { opacity: 0 } : { opacity: 0, x: 32, filter: 'blur(6px)' }, center: { opacity: 1, x: 0, filter: 'blur(0px)' }, exit: reduce ? { opacity: 0 } : { opacity: 0, x: -24, filter: 'blur(4px)' } };
  const cur = stage === 'money' ? moneyClauses[idx] : stage === 'rules' ? ruleClauses[idx] : null;

  return (
    <Shell progress={stage === 'welcome' ? 0.05 : stage === 'money' ? 0.1 + (idx / Math.max(1, moneyClauses.length)) * 0.35 : stage === 'rules' ? 0.5 + (idx / Math.max(1, ruleClauses.length)) * 0.25 : stage === 'full' ? 0.8 : stage === 'sign' ? 0.9 : 1}>
      <AnimatePresence mode="wait">
        <motion.div key={`${stage}-${idx}`} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          {stage === 'welcome' && (
            <div>
              <p className="label-caps" style={{ color: 'var(--fg-3)' }}>{settings.dba} · Agreement {r.number}</p>
              <h1 className="font-display text-[clamp(34px,6vw,56px)] leading-[1.04] mt-4">{c.firstName}, your {v.make} {v.model} is ready.</h1>
              <p className="mt-5 text-[17px] leading-relaxed max-w-[48ch]" style={{ color: 'var(--fg-2)' }}>
                {format(new Date(r.terms.startAt), 'EEEE, MMMM d')} to {format(new Date(r.terms.endAt), 'EEEE, MMMM d')}. Total {money(q.total, { cents: true })}{r.deposit.required ? `, plus a ${money(r.deposit.amount)} deposit that comes back after return` : ''}.
              </p>
              <p className="mt-4 text-[15px] max-w-[48ch]" style={{ color: 'var(--fg-3)' }}>This takes about four minutes. You will read the money terms one at a time and initial each, see the rules, then the full agreement, then sign.</p>
              <button className="btn btn-primary btn-lg mt-10" onClick={() => { setStage('money'); setIdx(0); tick(); }}>Start <ArrowRight aria-hidden className="size-4" /></button>
            </div>
          )}

          {(stage === 'money' || stage === 'rules') && cur && (
            <div>
              <p className="label-caps" style={{ color: 'var(--fg-3)' }}>{stage === 'money' ? 'Money' : 'Rules'} · {idx + 1} of {stage === 'money' ? moneyClauses.length : ruleClauses.length}</p>
              <h1 className="font-display text-[clamp(30px,5vw,48px)] leading-[1.06] mt-3">{cur.title}</h1>
              <p className="mt-5 text-[19px] leading-relaxed max-w-[44ch]">{fill(cur.plain, tokens)}</p>
              <details className="mt-5 max-w-[60ch]">
                <summary className="cursor-pointer text-[14px] underline underline-offset-4" style={{ color: 'var(--fg-3)' }}>Read the full legal text</summary>
                <p className="mt-3 text-[14px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>{fill(cur.body, tokens)}</p>
              </details>
              {stage === 'money' ? (
                <div className="mt-8 flex flex-wrap items-end gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-[13px] font-medium" style={{ color: 'var(--fg-2)' }}>Initial here ({expectedInitials})</span>
                    <input className="field-box w-28 text-center uppercase tracking-[0.3em] text-[18px] font-display" maxLength={3} value={initials[cur.id] ?? ''} autoFocus onChange={(e) => setInitials({ ...initials, [cur.id]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && initialsOk(cur.id)) { e.preventDefault(); advance(); } }} aria-label="Your initials" />
                  </label>
                  <button className="btn btn-primary" disabled={!initialsOk(cur.id)} onClick={advance}>Agree and continue <ArrowRight aria-hidden className="size-4" /></button>
                </div>
              ) : (
                <button className="btn btn-primary mt-8" onClick={advance} data-autofocus>Understood <ArrowRight aria-hidden className="size-4" /></button>
              )}
            </div>
          )}

          {stage === 'full' && (
            <div>
              <h1 className="font-display text-[clamp(30px,5vw,48px)] leading-[1.06]">The full agreement.</h1>
              <p className="mt-3 text-[15px]" style={{ color: 'var(--fg-2)' }}>Everything you initialed, plus the sections that carry no charge. Scroll through it, then sign.</p>
              <div className="mt-6 max-h-[55vh] overflow-y-auto rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}><ContractDoc ctx={ctx} /></div>
              <button className="btn btn-primary btn-lg mt-8" onClick={() => { setStage('sign'); tick(); }}>Continue to signature <ArrowRight aria-hidden className="size-4" /></button>
            </div>
          )}

          {stage === 'sign' && (
            <div className="max-w-[640px]">
              <h1 className="font-display text-[clamp(30px,5vw,48px)] leading-[1.06]">Sign as {fullName(c)}.</h1>
              <label className="mt-6 flex items-start gap-3 cursor-pointer text-[15px]">
                <input type="checkbox" className="mt-1 size-5 accent-[var(--accent)]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>I agree to sign electronically, I have read each section and its plain-language summary, and I authorize the charges described, including to the card on file after the car is returned.</span>
              </label>
              <div className="mt-6"><SignaturePad onChange={setSig} /></div>
              <button className="btn btn-primary btn-lg mt-8" disabled={!sig || !consent} onClick={finish}>Sign agreement</button>
              <p className="mt-4 text-[13px] inline-flex items-center gap-2" style={{ color: 'var(--fg-3)' }}><ShieldCheck aria-hidden className="size-4" /> Timestamped with your device details and stored with the agreement.</p>
            </div>
          )}

          {stage === 'done' && (
            <div>
              <span className="inline-flex size-14 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)' }}><Check aria-hidden weight="bold" className="size-6" /></span>
              <h1 className="font-display text-[clamp(30px,5vw,48px)] leading-[1.06] mt-6">Signed. See you {format(new Date(r.terms.startAt), 'EEEE')}.</h1>
              <p className="mt-4 text-[16px] leading-relaxed max-w-[48ch]" style={{ color: 'var(--fg-2)' }}>A copy goes to {c.email}. Bring your license and the card ending {r.payment.cardLast4 ?? 'on file'}. We will photograph the car together at pickup; you will get those photos too.</p>
              <p className="mt-6 text-[15px]"><a href={`tel:${settings.phone.replace(/\D/g, '')}`} className="underline underline-offset-4">{settings.phone}</a> for anything at all.</p>
            </div>
          )}

          {stage === 'expired' && (
            <div><h1 className="font-display text-[32px]">This link has expired.</h1><p className="mt-3" style={{ color: 'var(--fg-2)' }}>Ask {settings.dba} to send a fresh one. Nothing you entered was lost on their side.</p></div>
          )}
        </motion.div>
      </AnimatePresence>
    </Shell>
  );

  function advance() {
    tick();
    if (stage === 'money') {
      if (idx + 1 < moneyClauses.length) setIdx(idx + 1);
      else { setStage('rules'); setIdx(0); }
    } else if (stage === 'rules') {
      if (idx + 1 < ruleClauses.length) setIdx(idx + 1);
      else setStage('full');
    }
  }
}

function Shell({ children, progress = 0 }: { children: React.ReactNode; progress?: number }) {
  return (
    <div className="world-admin min-h-[100dvh] flex flex-col" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <div className="fixed top-0 inset-x-0 h-0.5 z-30" style={{ background: 'var(--line)' }} aria-hidden><motion.div className="h-full origin-left" style={{ background: 'var(--accent)' }} animate={{ scaleX: Math.max(0.02, progress) }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} /></div>
      <header className="h-16 flex items-center px-5 md:px-10"><Wordmark size="sm" /></header>
      <main className="flex-1 flex flex-col justify-center mx-auto w-full max-w-[860px] px-5 md:px-10 py-10">{children}</main>
    </div>
  );
}
