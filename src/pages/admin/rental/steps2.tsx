import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Minus, Plus, Warning } from '@phosphor-icons/react';
import { StepShell, Choice, YesNo } from '@/components/wizard/StepShell';
import { AddressInput } from '@/components/wizard/AddressInput';
import { Field, Input, MoneyInput, Segmented, Toggle } from '@/components/ui';
import type { StepProps } from './HandleRental';
import type { CompanySettings, PaymentMethod, RentalUnit, Vehicle } from '@/lib/types';
import { buildInstallments, computeEnd, quote, UNIT_DAYS } from '@/lib/pricing';
import { draftQuote } from '@/lib/buildRental';
import { isoDateTimeInput, money, num, cx } from '@/lib/util';
import { tick } from '@/lib/sound';

const unitRate = (v: Vehicle, u: RentalUnit) => (u === 'day' ? v.rates.daily : u === 'week' ? v.rates.weekly : v.rates.monthly);

/* 9. How long? */
export function TermStep({ draft, set, next, back, progress }: StepProps) {
  const endAt = computeEnd(draft.startAt, draft.unit, draft.quantity);
  return (
    <StepShell title="How long are they renting?" subtitle="Pick the unit first; the rate on the next screen follows it." onNext={next} onBack={back} canNext={draft.quantity >= 1 && !!draft.startAt} progress={progress}>
      <div className="flex flex-col gap-8">
        <Segmented ariaLabel="Rental unit" value={draft.unit} onChange={(u) => { set({ unit: u, rate: 0 }); tick(); }} options={[{ value: 'day', label: 'Days' }, { value: 'week', label: 'Weeks' }, { value: 'month', label: 'Months' }]} />
        <div className="flex items-center gap-6">
          <button aria-label="Fewer" className="size-14 rounded-full inline-flex items-center justify-center" style={{ background: 'var(--surface-2)' }} onClick={() => { set({ quantity: Math.max(1, draft.quantity - 1) }); tick(); }}><Minus className="size-5" /></button>
          <div className="flex items-baseline gap-3">
            <input type="number" min={1} className="field w-[120px] text-center text-[56px] tabular leading-none" value={draft.quantity} onChange={(e) => set({ quantity: Math.max(1, Number(e.target.value) || 1) })} aria-label="Quantity" />
            <span className="text-[20px]" style={{ color: 'var(--fg-2)' }}>{draft.unit}{draft.quantity === 1 ? '' : 's'}</span>
          </div>
          <button aria-label="More" className="size-14 rounded-full inline-flex items-center justify-center" style={{ background: 'var(--surface-2)' }} onClick={() => { set({ quantity: draft.quantity + 1 }); tick(); }}><Plus className="size-5" /></button>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4">
          <Field label="Pickup" htmlFor="start"><Input id="start" type="datetime-local" value={isoDateTimeInput(draft.startAt)} onChange={(e) => e.target.value && set({ startAt: new Date(e.target.value).toISOString() })} /></Field>
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--fg-2)' }}>Return</p>
            <p className="mt-3 text-[18px]">{format(new Date(endAt), "EEEE, MMMM d 'at' h:mm a")}</p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--fg-3)' }}>{UNIT_DAYS[draft.unit] * draft.quantity} days total</p>
          </div>
        </div>
      </div>
    </StepShell>
  );
}

/* 10. Rate */
export function RateStep({ draft, set, next, back, progress, vehicle }: StepProps & { vehicle: Vehicle }) {
  const listed = unitRate(vehicle, draft.unit);
  const rate = draft.rate || listed;
  const [showDiscount, setShowDiscount] = useState(draft.discount > 0);
  return (
    <StepShell title={`What is the rate per ${draft.unit}?`} subtitle={`Listed at ${money(listed)} per ${draft.unit} for the ${vehicle.model}. Change it here if you negotiated.`} onNext={next} onBack={back} canNext={rate > 0} progress={progress}>
      <MoneyInput big value={rate} onChange={(n) => set({ rate: n })} aria-label={`Rate per ${draft.unit}`} />
      <p className="mt-4 text-[15px] tabular" style={{ color: 'var(--fg-2)' }}>{draft.quantity} × {money(rate)} = <span style={{ color: 'var(--fg)' }}>{money(rate * draft.quantity)}</span> before tax</p>
      {rate < listed * 0.85 && <p className="mt-3 text-[14px] inline-flex items-center gap-2" style={{ color: 'var(--color-warn)' }}><Warning aria-hidden className="size-4" /> More than 15% under the listed rate.</p>}
      <div className="mt-8">
        {!showDiscount ? (
          <button className="text-[14px] underline underline-offset-4" style={{ color: 'var(--fg-3)' }} onClick={() => setShowDiscount(true)}>Apply a flat discount</button>
        ) : (
          <Field label="Flat discount" htmlFor="disc"><div className="max-w-[220px]"><MoneyInput id="disc" value={draft.discount} onChange={(n) => set({ discount: n })} /></div></Field>
        )}
      </div>
    </StepShell>
  );
}

/* 11. Mileage */
export function MileageStep({ draft, set, next, back, progress, vehicle }: StepProps & { vehicle: Vehicle }) {
  const days = UNIT_DAYS[draft.unit] * draft.quantity;
  const total = draft.includedMilesPerDay * days;
  return (
    <StepShell title="How many miles are included?" subtitle={`The ${vehicle.model} lists ${num(vehicle.includedMilesPerDay)} per day and ${money(vehicle.overagePerMile, { cents: true })} per extra mile.`} onNext={next} onBack={back} canNext={draft.includedMilesPerDay >= 0 && draft.overagePerMile >= 0} progress={progress}>
      <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
        <Field label="Miles per day" htmlFor="mpd"><Input id="mpd" type="number" min={0} value={draft.includedMilesPerDay} onChange={(e) => set({ includedMilesPerDay: Number(e.target.value) || 0 })} className="tabular text-[22px]" /></Field>
        <Field label="Overage per mile" htmlFor="opm"><MoneyInput id="opm" value={draft.overagePerMile} onChange={(n) => set({ overagePerMile: n })} className="text-[22px]" /></Field>
      </div>
      <p className="mt-8 text-[17px] tabular">{num(total)} miles included over {days} days. {draft.includedMilesPerDay === 0 ? 'Unlimited mileage is not recommended on exotics.' : ''}</p>
    </StepShell>
  );
}

/* 12. Deposit yes/no */
export function DepositStep({ draft, set, next, back, progress, vehicle }: StepProps & { vehicle: Vehicle }) {
  return (
    <StepShell title="Is there a security deposit?" subtitle={`The ${vehicle.model} defaults to ${money(vehicle.depositDefault)}. Skipping the deposit means every toll, scratch, and late hour is a chargeback fight instead of a deduction.`} onNext={draft.depositRequired === null ? undefined : () => next()} onBack={back} canNext={draft.depositRequired !== null} progress={progress}>
      <YesNo value={draft.depositRequired} onChange={(v) => { set({ depositRequired: v, depositAmount: v ? draft.depositAmount || vehicle.depositDefault : 0 }); tick(); }} yes="Yes" yesHint="Recommended" no="No deposit" noHint="Card on file still required" />
    </StepShell>
  );
}

/* 13. Deposit amount and method */
export function DepositAmountStep({ draft, set, next, back, progress, vehicle }: StepProps & { vehicle: Vehicle }) {
  return (
    <StepShell title="How much, and how is it held?" subtitle="A card hold never leaves the renter's account and releases in days. A charge is real money that takes a refund cycle to return. Cash cannot be recovered from later." onNext={next} onBack={back} canNext={draft.depositAmount > 0 && (draft.depositMethod !== 'collateral' || draft.collateralDescription.trim().length > 2)} progress={progress}>
      <MoneyInput big value={draft.depositAmount} onChange={(n) => set({ depositAmount: n })} aria-label="Deposit amount" />
      <div className="mt-3 flex flex-wrap gap-2">
        {[vehicle.depositDefault, Math.round(vehicle.depositDefault * 1.5), vehicle.depositDefault * 2].map((n) => (
          <button key={n} className={cx('h-8 px-3 rounded-full text-[13px] tabular', draft.depositAmount === n ? 'bg-[var(--fg)] text-[var(--bg)]' : 'bg-[var(--surface-2)]')} onClick={() => { set({ depositAmount: n }); tick(); }}>{money(n)}</button>
        ))}
      </div>
      <div className="mt-8">
        <Choice
          value={draft.depositMethod}
          onChange={(v) => set({ depositMethod: v })}
          options={[
            { value: 'card-hold', label: 'Card hold', hint: 'Pre-authorization. Releases in 5 business days.', badge: 'best' },
            { value: 'card-charge', label: 'Card charge', hint: 'Charged now, refunded after inspection.' },
            { value: 'cash', label: 'Cash', hint: 'Held in the safe. Receipt required.' },
            { value: 'collateral', label: 'Collateral', hint: 'A vehicle title or equivalent. Describe it.' },
          ]}
        />
        {draft.depositMethod === 'collateral' && (
          <Field label="Describe the collateral" htmlFor="col" required>
            <Input id="col" className="mt-2" placeholder="2019 BMW M4 title, VIN ending 4471, held in office safe" value={draft.collateralDescription} onChange={(e) => set({ collateralDescription: e.target.value })} />
          </Field>
        )}
      </div>
    </StepShell>
  );
}

/* 14. Down payment */
export function DownPaymentStep({ draft, set, next, back, progress, vehicle }: StepProps & { vehicle: Vehicle }) {
  const { terms } = draftQuote(draft, vehicle);
  const q = quote({ terms, additionalDriverCount: draft.additionalDrivers.length, additionalDriverFee: draft.fees.additionalDriverFee, depositAmount: 0, downPayment: 0, schedule: 'upfront' });
  const perWeek = Math.round(q.subtotal / Math.max(1, Math.ceil(q.days / 7)));
  const chips: [string, number][] = [['Full amount', q.subtotal], ['Half', Math.round(q.subtotal / 2)], ['First week', Math.min(q.subtotal, perWeek)]];
  return (
    <StepShell title="How much are they paying today?" subtitle={`The rental is ${money(q.subtotal)} before tax${draft.depositRequired ? `, plus the ${money(draft.depositAmount)} deposit` : ''}. Anything less than the full amount creates a payment schedule on the next screens.`} onNext={next} onBack={back} canNext={draft.downPayment > 0} progress={progress}>
      <MoneyInput big value={draft.downPayment} onChange={(n) => set({ downPayment: n, schedule: n >= q.subtotal ? 'upfront' : draft.schedule === 'upfront' ? 'weekly' : draft.schedule })} aria-label="Down payment" />
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map(([l, n]) => (
          <button key={l} className={cx('h-8 px-3 rounded-full text-[13px] tabular', draft.downPayment === n ? 'bg-[var(--fg)] text-[var(--bg)]' : 'bg-[var(--surface-2)]')} onClick={() => { set({ downPayment: n, schedule: n >= q.subtotal ? 'upfront' : 'weekly' }); tick(); }}>{l} · {money(n)}</button>
        ))}
      </div>
      {draft.downPayment > 0 && draft.downPayment < q.subtotal && <p className="mt-6 text-[15px] tabular" style={{ color: 'var(--fg-2)' }}>{money(q.subtotal - draft.downPayment)} remaining, before tax.</p>}
    </StepShell>
  );
}

/* 15. Payment method */
const UNTRACKABLE: PaymentMethod[] = ['zelle', 'cashapp', 'cash', 'crypto'];
export function PaymentMethodStep({ draft, set, next, back, progress, settings }: StepProps & { settings: CompanySettings }) {
  const p = settings.payments;
  const risky = UNTRACKABLE.includes(draft.paymentMethod);
  const needsCard = draft.paymentMethod === 'card-on-file' || p.requireCardOnFile;
  const cardOk = !needsCard || (draft.cardLast4.length === 4 && draft.cardBrand.length > 0);
  const ok = cardOk && (!risky || (draft.riskAcknowledged && draft.cardOnFileAuthorized));
  return (
    <StepShell title="How are they paying?" subtitle="Card on file is the only method that can recover tolls, tickets, damage, or a missed installment after the car is back. Everything else is money you have to ask for." onNext={next} onBack={back} canNext={ok} progress={progress} wide>
      <Choice
        value={draft.paymentMethod}
        onChange={(v) => { set({ paymentMethod: v, riskAcknowledged: false, cardOnFileAuthorized: v === 'card-on-file' ? true : draft.cardOnFileAuthorized }); tick(); }}
        columns={3}
        options={[
          { value: 'card-on-file', label: 'Card on file', hint: 'Authorizes post-return charges.', badge: 'best', disabled: !p.acceptCard },
          { value: 'ach', label: 'Bank transfer', hint: 'Traceable. 1 to 3 days to settle.', disabled: !p.acceptAch },
          { value: 'wire', label: 'Wire', hint: 'Traceable. Same day.', disabled: !p.acceptWire },
          { value: 'cash', label: 'Cash', hint: 'Untraceable. Receipt required.', badge: 'risk', disabled: !p.acceptCash },
          { value: 'zelle', label: 'Zelle', hint: 'Not reversible, not disputable.', badge: 'risk', disabled: !p.acceptZelle },
          { value: 'cashapp', label: 'Cash App', hint: 'Not reversible, not disputable.', badge: 'risk', disabled: !p.acceptCashApp },
          { value: 'crypto', label: 'Crypto', hint: 'Irreversible.', badge: 'risk', disabled: !p.acceptCrypto },
        ]}
      />
      {risky && (
        <div className="mt-8 rounded-[var(--radius)] p-5" style={{ background: 'color-mix(in oklab, var(--color-warn) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--color-warn) 40%, transparent)' }}>
          <p className="text-[15px] font-medium">This method gives the renter leverage.</p>
          <p className="text-[14px] mt-1" style={{ color: 'var(--fg-2)' }}>They can stop paying at any point and there is nothing to charge. The app requires a card on file for incidentals alongside it.</p>
          <div className="mt-2 divide-y" style={{ borderColor: 'var(--line)' }}>
            <Toggle id="risk" label="I understand and accept the collection risk" checked={draft.riskAcknowledged} onChange={(v) => set({ riskAcknowledged: v })} />
            <Toggle id="cof" label="A card is on file for deposit and incidentals" checked={draft.cardOnFileAuthorized} onChange={(v) => set({ cardOnFileAuthorized: v })} />
          </div>
        </div>
      )}
      {(draft.paymentMethod === 'card-on-file' || draft.cardOnFileAuthorized || p.requireCardOnFile) && (
        <div className="mt-8 grid sm:grid-cols-3 gap-x-8 gap-y-6">
          <Field label="Card brand" htmlFor="brand" required>
            <select id="brand" className="field-box" value={draft.cardBrand} onChange={(e) => set({ cardBrand: e.target.value })}><option value="">Choose</option>{['Visa', 'Mastercard', 'Amex', 'Discover'].map((b) => <option key={b}>{b}</option>)}</select>
          </Field>
          <Field label="Last four digits" htmlFor="l4" required hint="Card must be in the renter's name."><Input id="l4" inputMode="numeric" maxLength={4} className="font-mono" value={draft.cardLast4} onChange={(e) => set({ cardLast4: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></Field>
          <div className="self-end text-[13px] pb-3" style={{ color: 'var(--fg-3)' }}>{import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Stripe connected.' : 'Connect Stripe in .env to tokenize cards here.'}</div>
        </div>
      )}
    </StepShell>
  );
}

/* 16. Schedule */
export function ScheduleStep({ draft, set, next, back, progress, vehicle, settings }: StepProps & { vehicle: Vehicle; settings: CompanySettings }) {
  const { terms } = draftQuote(draft, vehicle);
  terms.taxRate = settings.taxRate;
  const q = quote({ terms, additionalDriverCount: draft.additionalDrivers.length, additionalDriverFee: draft.fees.additionalDriverFee, depositAmount: 0, downPayment: draft.downPayment, schedule: draft.schedule });
  const paidInFull = draft.downPayment >= q.total;
  const inst = useMemo(() => buildInstallments({ terms, total: q.total, downPayment: draft.downPayment, schedule: paidInFull ? 'upfront' : draft.schedule }), [terms, q.total, draft.downPayment, draft.schedule, paidInFull]);
  const days = UNIT_DAYS[draft.unit] * draft.quantity;
  return (
    <StepShell title={paidInFull ? 'Paid in full at signing.' : 'How is the balance paid?'} subtitle={paidInFull ? `${money(q.total, { cents: true })} including ${money(q.tax, { cents: true })} tax. Nothing further is owed unless the rental extends.` : `${money(q.total - draft.downPayment, { cents: true })} remains after today's ${money(draft.downPayment)}. Installments are charged to the card on file automatically.`} onNext={next} onBack={back} progress={progress} wide>
      {!paidInFull && (
        <Choice
          value={draft.schedule}
          onChange={(v) => { set({ schedule: v }); tick(); }}
          columns={3}
          options={[
            { value: 'weekly', label: 'Weekly', hint: 'Every 7 days from pickup.' },
            { value: 'biweekly', label: 'Every two weeks', disabled: days < 14 },
            { value: 'monthly', label: 'Monthly', disabled: days < 30 },
          ]}
        />
      )}
      <ol className="mt-8 rounded-[var(--radius)] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
        {inst.map((i, n) => (
          <li key={i.id} className="flex items-center justify-between gap-4 px-5 py-3 text-[15px]" style={{ borderTop: n ? '1px solid var(--line)' : undefined }}>
            <span>{i.label}<span className="ml-2 text-[13px]" style={{ color: 'var(--fg-3)' }}>{format(new Date(i.dueAt), 'EEE, MMM d')}</span></span>
            <span className="tabular font-medium">{money(i.amount, { cents: true })}</span>
          </li>
        ))}
      </ol>
    </StepShell>
  );
}

/* 17. Renewal */
export function RenewalStep({ draft, set, next, back, progress }: StepProps) {
  const rate = draft.rate;
  return (
    <StepShell title="Are they likely to extend?" subtitle="Extensions must be requested in writing before the return time and prepaid. Deciding the extension rate now avoids a renegotiation at 11pm on return day." onNext={next} onBack={back} progress={progress}>
      <Choice
        value={draft.renewalIntent}
        onChange={(v) => { set({ renewalIntent: v, renewalRate: draft.renewalRate || rate }); tick(); }}
        columns={3}
        options={[
          { value: 'none', label: 'No', hint: 'Return on the date.' },
          { value: 'likely', label: 'Possibly', hint: 'Quote the extension rate now.' },
          { value: 'auto-renew', label: 'Auto-renew', hint: `Rolls over each ${draft.unit} until cancelled.` },
        ]}
      />
      {draft.renewalIntent !== 'none' && (
        <div className="mt-8 max-w-[260px]">
          <Field label={`Extension rate per ${draft.unit}`} htmlFor="rr"><MoneyInput id="rr" value={draft.renewalRate || rate} onChange={(n) => set({ renewalRate: n })} /></Field>
        </div>
      )}
    </StepShell>
  );
}

/* 18. Delivery */
export function DeliveryStep({ draft, set, next, back, progress }: StepProps) {
  const ok = draft.deliveryEnabled === false || (draft.deliveryEnabled === true && !!draft.deliveryAddress?.line1);
  return (
    <StepShell title="Pickup at the lot, or delivered?" onNext={next} onBack={back} canNext={ok} progress={progress}>
      <YesNo value={draft.deliveryEnabled} onChange={(v) => { set({ deliveryEnabled: v }); tick(); }} yes="Deliver it" yesHint="Renter must be present with ID." no="Pickup at the lot" />
      {draft.deliveryEnabled && (
        <div className="mt-8 flex flex-col gap-6">
          <AddressInput value={draft.deliveryAddress} onChange={(a) => set({ deliveryAddress: a })} autoFocus line={false} />
          <div className="grid sm:grid-cols-2 gap-6 items-end">
            <Field label="Delivery fee" htmlFor="df"><MoneyInput id="df" value={draft.deliveryFee} onChange={(n) => set({ deliveryFee: n })} /></Field>
            <Toggle id="rp" label="Collect it from the same address at return" description="Adds the fee again." checked={draft.returnPickup} onChange={(v) => set({ returnPickup: v })} />
          </div>
        </div>
      )}
    </StepShell>
  );
}

/* 19. Rules and fees */
export function RulesStep({ draft, set, next, back, progress, settings }: StepProps & { settings: CompanySettings }) {
  const r = draft.rules;
  const f = draft.fees;
  const setR = (p: Partial<typeof r>) => set({ rules: { ...r, ...p } });
  const setF = (p: Partial<typeof f>) => set({ fees: { ...f, ...p } });
  const [showFees, setShowFees] = useState(false);
  return (
    <StepShell title="Where can it go, and what does breaking the rules cost?" subtitle="These print into the agreement with a plain-language line each. Defaults come from Settings." onNext={next} onBack={back} progress={progress} wide>
      <Choice
        value={r.geographicLimit}
        onChange={(v) => { setR({ geographicLimit: v }); tick(); }}
        columns={3}
        options={[
          { value: 'metro', label: `${settings.lotAddress?.city ?? 'Metro'} area` },
          { value: 'state', label: `Within ${settings.governingState}` },
          { value: 'regional', label: 'Neighboring states' },
          { value: 'national', label: 'Continental US' },
          { value: 'custom', label: 'Custom radius' },
        ]}
      />
      {r.geographicLimit === 'custom' && (
        <div className="mt-4 max-w-[220px]"><Field label="Radius from pickup, miles" htmlFor="rad"><Input id="rad" type="number" value={r.radiusMiles ?? 250} onChange={(e) => setR({ radiusMiles: Number(e.target.value) })} /></Field></div>
      )}
      <div className="mt-8 grid md:grid-cols-2 gap-x-12">
        <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
          <Toggle id="gps" label="GPS tracking disclosed and consented" description="Required to recover the car. Disclosure is the law in most states." checked={r.gpsConsent} onChange={(v) => setR({ gpsConsent: v })} />
          <Toggle id="si" label="Starter interrupt on default" description="Never while moving. Only on non-payment, prohibited use, or theft." checked={r.starterInterruptConsent} onChange={(v) => setR({ starterInterruptConsent: v })} />
          <Toggle id="pets" label="Pets allowed" checked={r.petsAllowed} onChange={(v) => setR({ petsAllowed: v })} />
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
          <Toggle id="track" label="Track and racing prohibited" checked={r.trackUseProhibited} onChange={(v) => setR({ trackUseProhibited: v })} />
          <Toggle id="rs" label="Rideshare and commercial use prohibited" checked={r.rideshareProhibited} onChange={(v) => setR({ rideshareProhibited: v })} />
          <Toggle id="sub" label="Subleasing prohibited" checked={r.subleaseProhibited} onChange={(v) => setR({ subleaseProhibited: v })} />
        </div>
      </div>
      <button className="mt-6 text-[14px] underline underline-offset-4" style={{ color: 'var(--fg-3)' }} onClick={() => setShowFees((s) => !s)}>{showFees ? 'Hide fees' : `Adjust fees (late ${money(f.lateFeePerHour)}/hr, cleaning ${money(f.cleaningFee)}, smoking ${money(f.smokingFee)})`}</button>
      {showFees && (
        <div className="mt-4 grid sm:grid-cols-3 gap-x-8 gap-y-5">
          <Field label="Late fee per hour" htmlFor="lf"><MoneyInput id="lf" value={f.lateFeePerHour} onChange={(n) => setF({ lateFeePerHour: n })} /></Field>
          <Field label="Grace period, minutes" htmlFor="gr"><Input id="gr" type="number" value={f.lateGraceMinutes} onChange={(e) => setF({ lateGraceMinutes: Number(e.target.value) })} /></Field>
          <Field label="Cleaning fee" htmlFor="cf"><MoneyInput id="cf" value={f.cleaningFee} onChange={(n) => setF({ cleaningFee: n })} /></Field>
          <Field label="Smoking fee" htmlFor="sf"><MoneyInput id="sf" value={f.smokingFee} onChange={(n) => setF({ smokingFee: n })} /></Field>
          <Field label="Toll admin fee, per event" htmlFor="tf"><MoneyInput id="tf" value={f.tollAdminFee} onChange={(n) => setF({ tollAdminFee: n })} /></Field>
          <Field label="Citation admin fee" htmlFor="cif"><MoneyInput id="cif" value={f.ticketAdminFee} onChange={(n) => setF({ ticketAdminFee: n })} /></Field>
          <Field label="Fuel, per eighth tank" htmlFor="ff"><MoneyInput id="ff" value={f.fuelRefillPerEighth} onChange={(n) => setF({ fuelRefillPerEighth: n })} /></Field>
          <Field label="Required octane" htmlFor="oct"><Input id="oct" type="number" value={r.requiredFuelOctane ?? ''} onChange={(e) => setR({ requiredFuelOctane: Number(e.target.value) || undefined })} /></Field>
          <Field label="Early return" htmlFor="et">
            <select id="et" className="field-box" value={f.earlyTerminationPolicy} onChange={(e) => setF({ earlyTerminationPolicy: e.target.value as typeof f.earlyTerminationPolicy })}>
              <option value="no-refund">No refund</option><option value="prorated">Prorated refund</option><option value="prorated-minus-fee">Prorated minus a fee</option>
            </select>
          </Field>
        </div>
      )}
    </StepShell>
  );
}
