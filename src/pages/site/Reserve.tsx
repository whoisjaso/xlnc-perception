import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check } from '@phosphor-icons/react';
import { addDays, format } from 'date-fns';
import { useFleet, useReservations } from '@/store';
import { VehicleImage } from '@/components/site/VehicleImage';
import { formatPhone, isEmail, money, cx } from '@/lib/util';

type Step = 'vehicle' | 'dates' | 'contact' | 'notes' | 'done';
const ORDER: Step[] = ['vehicle', 'dates', 'contact', 'notes', 'done'];

/** Reservation request: one decision per screen, keyboard-first, nothing to scroll. */
export function Reserve() {
  const vehicles = useFleet((s) => s.vehicles);
  const add = useReservations((s) => s.add);
  const [params] = useSearchParams();
  const preset = vehicles.find((v) => v.slug === params.get('vehicle'));
  const [step, setStep] = useState<Step>(preset ? 'dates' : 'vehicle');
  const [dir, setDir] = useState(1);
  const [vehicleId, setVehicleId] = useState<string | undefined>(preset?.id);
  const [start, setStart] = useState(format(addDays(new Date(), 2), 'yyyy-MM-dd'));
  const [end, setEnd] = useState(format(addDays(new Date(), 5), 'yyyy-MM-dd'));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const vehicle = vehicles.find((v) => v.id === vehicleId);

  const go = (next: Step) => { setDir(ORDER.indexOf(next) > ORDER.indexOf(step) ? 1 : -1); setError(null); setStep(next); };
  const idx = ORDER.indexOf(step);

  const days = useMemo(() => Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000)), [start, end]);
  const estimate = useMemo(() => {
    if (!vehicle) return 0;
    if (days >= 28) return Math.ceil(days / 30) * vehicle.rates.monthly;
    if (days >= 7) return Math.floor(days / 7) * vehicle.rates.weekly + (days % 7) * vehicle.rates.daily;
    return days * vehicle.rates.daily;
  }, [vehicle, days]);

  const submit = () => {
    if (!name.trim()) return setError('Your name, so we know who to call.');
    if (!isEmail(email)) return setError('A working email address.');
    if (phone.replace(/\D/g, '').length < 10) return setError('A phone number with area code.');
    add({ vehicleId, name: name.trim(), email: email.trim(), phone, startAt: new Date(start).toISOString(), endAt: new Date(end).toISOString(), message: message.trim() || undefined });
    go('done');
  };

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: 40 * d, filter: 'blur(6px)' }),
    center: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: -40 * d, filter: 'blur(6px)' }),
  };

  return (
    <div className="mx-auto max-w-[1100px] px-5 md:px-10 pt-32 md:pt-40 min-h-[100dvh] flex flex-col">
      <title>Reserve. Nova Wheels</title>
      {step !== 'done' && (
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3" aria-label={`Screen ${idx + 1} of 4`}>
            {ORDER.slice(0, 4).map((s, i) => (
              <span key={s} className="h-px transition-all duration-500" style={{ width: i === idx ? 40 : 18, background: i <= idx ? 'var(--fg)' : 'var(--line-strong)' }} />
            ))}
          </div>
          {idx > 0 && (
            <button onClick={() => go(ORDER[idx - 1])} className="label-caps inline-flex items-center gap-2" style={{ color: 'var(--fg-2)' }}>
              <ArrowLeft aria-hidden className="size-3.5" /> Back
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className="flex-1">
          {step === 'vehicle' && (
            <div>
              <h1 className="font-display text-[clamp(34px,5vw,64px)] leading-[1.02]">Which car?</h1>
              <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.filter((v) => v.status !== 'retired').map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setVehicleId(v.id); go('dates'); }}
                    aria-pressed={vehicleId === v.id}
                    className="tile group !p-0 overflow-hidden text-left"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <VehicleImage vehicle={v} className="w-full h-full transition-transform duration-[1200ms] group-hover:scale-[1.04]" />
                    </div>
                    <div className="p-4 flex items-baseline justify-between gap-3">
                      <span className="font-display text-[20px] leading-tight">{v.make} {v.model}</span>
                      <span className="text-[13px] tabular whitespace-nowrap" style={{ color: 'var(--fg-3)' }}>{money(v.rates.daily)}/day</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'dates' && vehicle && (
            <div className="grid md:grid-cols-[1fr_1fr] gap-12">
              <div>
                <h1 className="font-display text-[clamp(34px,5vw,64px)] leading-[1.02]">When?</h1>
                <p className="mt-3 text-[16px]" style={{ color: 'var(--fg-2)' }}>{vehicle.year} {vehicle.make} {vehicle.model}. <button className="underline-offset underline" onClick={() => go('vehicle')}>Change</button></p>
                <div className="mt-10 grid grid-cols-2 gap-6">
                  <label className="flex flex-col gap-2">
                    <span className="label-caps" style={{ color: 'var(--fg-3)' }}>Pick up</span>
                    <input type="date" className="field text-[20px]" value={start} min={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => { setStart(e.target.value); if (e.target.value >= end) setEnd(format(addDays(new Date(e.target.value), 1), 'yyyy-MM-dd')); }} />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="label-caps" style={{ color: 'var(--fg-3)' }}>Return</span>
                    <input type="date" className="field text-[20px]" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
                  </label>
                </div>
                <div className="mt-8 flex items-baseline gap-3">
                  <p className="font-display text-[40px] tabular leading-none">{money(estimate)}</p>
                  <p className="text-[14px]" style={{ color: 'var(--fg-3)' }}>estimate for {days} {days === 1 ? 'day' : 'days'}, before tax and deposit</p>
                </div>
                <button onClick={() => go('contact')} className="btn btn-primary btn-lg mt-10">Continue <ArrowRight aria-hidden className="size-4" /></button>
              </div>
              <div className="hidden md:block aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)]">
                <VehicleImage vehicle={vehicle} className="w-full h-full" />
              </div>
            </div>
          )}

          {step === 'contact' && (
            <ContactStep name={name} email={email} phone={phone} setName={setName} setEmail={setEmail} setPhone={setPhone} error={error} onNext={() => {
              if (!name.trim()) return setError('Your name, so we know who to call.');
              if (!isEmail(email)) return setError('A working email address.');
              if (phone.replace(/\D/g, '').length < 10) return setError('A phone number with area code.');
              go('notes');
            }} />
          )}

          {step === 'notes' && (
            <div className="max-w-[640px]">
              <h1 className="font-display text-[clamp(34px,5vw,64px)] leading-[1.02]">Anything we should know?</h1>
              <p className="mt-3 text-[16px]" style={{ color: 'var(--fg-2)' }}>Delivery address, an occasion, a second driver. Optional.</p>
              <textarea className="field mt-8 text-[20px] min-h-[120px] resize-none" placeholder="Deliver to the Post Oak on Friday at 6pm" value={message} onChange={(e) => setMessage(e.target.value)} />
              {error && <p role="alert" className="mt-4 text-[14px]" style={{ color: 'var(--color-danger)' }}>{error}</p>}
              <button onClick={submit} className="btn btn-primary btn-lg mt-10">Send request <ArrowRight aria-hidden className="size-4" /></button>
            </div>
          )}

          {step === 'done' && (
            <div className="max-w-[640px] pt-10">
              <span className="inline-flex size-14 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)' }}><Check aria-hidden weight="bold" className="size-6" /></span>
              <h1 className="font-display text-[clamp(34px,5vw,64px)] leading-[1.02] mt-8">Request received.</h1>
              <p className="mt-4 text-[17px] leading-relaxed" style={{ color: 'var(--fg-2)' }}>
                We confirm availability by text within the hour between 8am and 10pm. If {vehicle ? `the ${vehicle.model}` : 'the car'} is booked for those dates, we will offer the closest alternative before you hear a no.
              </p>
              <Link to="/fleet" className="btn btn-ghost mt-10">Back to the fleet</Link>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ContactStep({ name, email, phone, setName, setEmail, setPhone, error, onNext }: { name: string; email: string; phone: string; setName: (s: string) => void; setEmail: (s: string) => void; setPhone: (s: string) => void; error: string | null; onNext: () => void }) {
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => { first.current?.focus(); }, []);
  return (
    <form className="max-w-[640px]" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
      <h1 className="font-display text-[clamp(34px,5vw,64px)] leading-[1.02]">How do we reach you?</h1>
      <div className="mt-10 flex flex-col gap-6">
        <input ref={first} className="field" placeholder="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Full name" required />
        <input className="field" placeholder="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" required />
        <input className={cx('field')} placeholder="Phone" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} aria-label="Phone" required />
      </div>
      {error && <p role="alert" className="mt-4 text-[14px]" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      <button type="submit" className="btn btn-primary btn-lg mt-10">Continue <ArrowRight aria-hidden className="size-4" /></button>
    </form>
  );
}
