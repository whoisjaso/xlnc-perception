import { useEffect, useMemo, useRef, useState } from 'react';
import { MagnifyingGlass, Plus, X, Camera, Warning } from '@phosphor-icons/react';
import { StepShell, Choice, YesNo } from '@/components/wizard/StepShell';
import { AddressInput } from '@/components/wizard/AddressInput';
import { VehicleImage } from '@/components/site/VehicleImage';
import { Field, Input, MoneyInput, Toggle, Pill } from '@/components/ui';
import { useFleet } from '@/store';
import type { StepProps } from './HandleRental';
import type { Customer, DamageMark, Vehicle } from '@/lib/types';
import { decodeVin } from '@/lib/vin';
import { compressImage } from '@/lib/image';
import { ageOn, formatPhone, fullName, isEmail, money, nowIso, slugify, uid, validVin, US_STATES, cx } from '@/lib/util';
import { tick, errorTone } from '@/lib/sound';

/* 1. Which car? */
export function VehicleStep({ draft, set, next, back, progress }: StepProps) {
  const vehicles = useFleet((s) => s.vehicles);
  const upsert = useFleet((s) => s.upsert);
  const [q, setQ] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [vin, setVin] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const list = useMemo(() => vehicles.filter((v) => v.status !== 'retired' && `${v.year} ${v.make} ${v.model} ${v.plate ?? ''} ${v.color}`.toLowerCase().includes(q.toLowerCase())), [vehicles, q]);

  const choose = (v: Vehicle) => {
    tick();
    set({ vehicleId: v.id, rate: 0, includedMilesPerDay: v.includedMilesPerDay, overagePerMile: v.overagePerMile, depositAmount: v.depositDefault, odometerOut: v.odometer });
    next();
  };

  const decode = async () => {
    setErr(null);
    if (!validVin(vin)) { setErr('That does not look like a valid 17-character VIN. Check for O, I, or Q.'); errorTone(); return; }
    setBusy(true);
    try {
      const r = await decodeVin(vin);
      if (!r.make || !r.model) throw new Error(r.errorText ?? 'The decoder returned nothing for that VIN.');
      const now = nowIso();
      const v: Vehicle = {
        id: uid('veh'), slug: slugify(`${r.make} ${r.model} ${r.year ?? ''} ${vin.slice(-4)}`), vin: r.vin, year: r.year ?? new Date().getFullYear(), make: r.make, model: r.model, trim: r.trim, bodyClass: r.bodyClass,
        color: '', class: /suv|utility/i.test(r.bodyClass ?? '') ? 'luxury-suv' : /convertible|roadster/i.test(r.bodyClass ?? '') ? 'convertible' : /sedan/i.test(r.bodyClass ?? '') ? 'luxury-sedan' : 'supercar',
        status: 'available', odometer: 0, fuelType: r.fuelType, transmission: r.transmission, drive: r.drive, horsepower: r.horsepower, seats: r.seats,
        rates: { daily: 0, weekly: 0, monthly: 0 }, depositDefault: draft.depositAmount, includedMilesPerDay: draft.includedMilesPerDay, overagePerMile: draft.overagePerMile, minRenterAge: 25,
        gps: { starterInterrupt: false }, createdAt: now, updatedAt: now,
      };
      upsert(v);
      choose(v);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Decoder unavailable. Add the car manually from Inventory.');
      errorTone();
    } finally { setBusy(false); }
  };

  return (
    <StepShell title="Which car is it?" subtitle="Cars out on rental are shown but cannot be selected." onBack={back} progress={progress} wide>
      {!addMode ? (
        <>
          <div className="relative mb-6">
            <MagnifyingGlass aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 size-5" style={{ color: 'var(--fg-3)' }} />
            <input className="field-box pl-12 h-12" placeholder="Search make, model, plate, color" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search vehicles" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((v) => {
              const out = v.status === 'rented' || v.status === 'maintenance' || v.status === 'transit';
              return (
                <button key={v.id} onClick={() => !out && choose(v)} disabled={out} aria-pressed={draft.vehicleId === v.id} className="tile !p-0 overflow-hidden text-left disabled:opacity-45 disabled:cursor-not-allowed">
                  <div className="aspect-[16/9] overflow-hidden"><VehicleImage vehicle={v} plateClass="plate-light" className="w-full h-full" /></div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[16px] font-medium truncate">{v.year} {v.make} {v.model}</span>
                      {out ? <Pill tone="warn">{v.status === 'rented' ? 'Out' : 'In service'}</Pill> : <Pill tone="ok">Ready</Pill>}
                    </div>
                    <span className="block text-[13px] mt-1 tabular" style={{ color: 'var(--fg-3)' }}>{v.color}{v.plate ? ` · ${v.plate}` : ''} · {money(v.rates.daily)}/day</span>
                  </div>
                </button>
              );
            })}
            <button onClick={() => setAddMode(true)} className="tile items-center justify-center min-h-[180px] border-dashed">
              <Plus aria-hidden className="size-6" style={{ color: 'var(--fg-3)' }} />
              <span className="text-[15px] font-medium">Not in inventory</span>
              <span className="text-[13px]" style={{ color: 'var(--fg-3)' }}>Add it by VIN</span>
            </button>
          </div>
        </>
      ) : (
        <div className="max-w-[560px]">
          <label className="label-caps" style={{ color: 'var(--fg-3)' }} htmlFor="vin">VIN</label>
          <input id="vin" className="field font-mono uppercase tracking-[0.12em]" placeholder="17 characters" value={vin} maxLength={17} autoFocus onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); void decode(); } }} />
          <p className="mt-3 text-[13px]" style={{ color: 'var(--fg-3)' }}>Decoded through the NHTSA database. Year, make, model, body, engine, and drivetrain fill in automatically. Rates, color, and plate are set afterward in Inventory.</p>
          {err && <p role="alert" className="mt-3 text-[14px]" style={{ color: 'var(--color-danger)' }}>{err}</p>}
          <div className="mt-6 flex gap-3">
            <button className="btn btn-accent" onClick={() => void decode()} disabled={busy || vin.length !== 17}>{busy ? 'Decoding' : 'Decode and add'}</button>
            <button className="btn btn-quiet" onClick={() => setAddMode(false)}>Back to the fleet</button>
          </div>
        </div>
      )}
    </StepShell>
  );
}

/* 2. Condition at check-out */
const ZONES = ['front-bumper', 'front-splitter', 'hood', 'windshield', 'roof', 'driver-door', 'passenger-door', 'driver-rear-quarter', 'passenger-rear-quarter', 'rear-bumper', 'diffuser', 'trunk', 'wheel-fl', 'wheel-fr', 'wheel-rl', 'wheel-rr', 'interior', 'other'];
export function ConditionStep({ draft, set, next, back, progress, vehicle }: StepProps & { vehicle: Vehicle }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [zone, setZone] = useState(ZONES[0]);
  const [sev, setSev] = useState<DamageMark['severity']>('scuff');
  const [note, setNote] = useState('');
  const odo = draft.odometerOut ?? vehicle.odometer;

  const addMark = () => {
    set({ damages: [...draft.damages, { id: uid('dmg'), zone, severity: sev, note: note || undefined }] });
    setNote('');
    tick();
  };
  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const added = await Promise.all(Array.from(files).slice(0, 12).map(async (f) => ({ id: uid('ph'), label: f.name, dataUrl: await compressImage(f), takenAt: nowIso() })));
    set({ photos: [...draft.photos, ...added] });
  };

  return (
    <StepShell title={`Condition of the ${vehicle.model} right now.`} subtitle="This becomes the check-out record in the contract. Photograph every panel, both bumpers, all four wheels, the dash with fuel and odometer, and the interior." onNext={next} onBack={back} progress={progress} canNext={odo > 0} wide>
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
        <Field label="Odometer" htmlFor="odo" required>
          <div className="relative"><input id="odo" type="number" inputMode="numeric" className="field pr-12 tabular text-[32px]" value={odo || ''} onChange={(e) => set({ odometerOut: Number(e.target.value) })} /><span className="absolute right-0 bottom-4 text-[14px]" style={{ color: 'var(--fg-3)' }}>mi</span></div>
        </Field>
        <div>
          <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--fg-2)' }}>Fuel level</p>
          <div role="radiogroup" aria-label="Fuel level in eighths" className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button key={n} role="radio" aria-checked={Math.round(draft.fuelOut * 8) === n} aria-label={`${n}/8`} onClick={() => { set({ fuelOut: n / 8 }); tick(); }} className="h-12 flex-1 rounded-md transition-colors" style={{ background: n <= Math.round(draft.fuelOut * 8) ? 'var(--accent)' : 'var(--surface-2)' }} />
            ))}
          </div>
          <p className="mt-2 text-[13px] tabular" style={{ color: 'var(--fg-3)' }}>{Math.round(draft.fuelOut * 8) === 8 ? 'Full' : `${Math.round(draft.fuelOut * 8)}/8`}{vehicle.fuelType === 'Electric' ? ' charge' : ''}</p>
        </div>

        <div className="md:col-span-2">
          <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--fg-2)' }}>Pre-existing marks</p>
          <div className="flex flex-wrap gap-2 items-end">
            <select className="field-box w-auto" value={zone} onChange={(e) => setZone(e.target.value)} aria-label="Zone">{ZONES.map((z) => <option key={z} value={z}>{z.replace(/-/g, ' ')}</option>)}</select>
            <select className="field-box w-auto" value={sev} onChange={(e) => setSev(e.target.value as DamageMark['severity'])} aria-label="Severity">{['scuff', 'scratch', 'dent', 'crack', 'missing', 'other'].map((s) => <option key={s}>{s}</option>)}</select>
            <input className="field-box flex-1 min-w-[180px]" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); addMark(); } }} aria-label="Note" />
            <button className="btn btn-ghost btn-sm" onClick={addMark}><Plus aria-hidden className="size-4" /> Add</button>
          </div>
          {draft.damages.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {draft.damages.map((d) => (
                <li key={d.id} className="inline-flex items-center gap-2 h-8 pl-3 pr-1 rounded-full text-[13px]" style={{ background: 'var(--surface-2)' }}>
                  {d.zone.replace(/-/g, ' ')} · {d.severity}{d.note ? ` · ${d.note}` : ''}
                  <button aria-label="Remove" onClick={() => set({ damages: draft.damages.filter((x) => x.id !== d.id) })} className="size-6 inline-flex items-center justify-center rounded-full hover:bg-[var(--line)]"><X className="size-3.5" /></button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="md:col-span-2">
          <p className="text-[13px] font-medium mb-3" style={{ color: 'var(--fg-2)' }}>Photos <span style={{ color: 'var(--fg-3)' }}>({draft.photos.length})</span></p>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={(e) => void onFiles(e.target.files)} />
          <div className="flex flex-wrap gap-3">
            <button onClick={() => fileRef.current?.click()} className="tile w-28 h-28 items-center justify-center gap-2 !p-0"><Camera aria-hidden className="size-6" /><span className="text-[12px]">Add photos</span></button>
            {draft.photos.map((p) => (
              <div key={p.id} className="relative w-28 h-28 rounded-[var(--radius)] overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                <img src={p.dataUrl} alt={p.label} className="w-full h-full object-cover" />
                <button aria-label="Remove photo" onClick={() => set({ photos: draft.photos.filter((x) => x.id !== p.id) })} className="absolute top-1 right-1 size-6 inline-flex items-center justify-center rounded-full" style={{ background: 'rgb(15 16 18 / 0.7)', color: '#fff' }}><X className="size-3.5" /></button>
              </div>
            ))}
          </div>
          {draft.photos.length < 8 && <p className="mt-3 text-[13px] inline-flex items-center gap-2" style={{ color: 'var(--color-warn)' }}><Warning aria-hidden className="size-4" /> Fewer than eight photos. Damage claims are won on timestamped photos; disputes are lost without them.</p>}
        </div>
      </div>
    </StepShell>
  );
}

/* 3. Renter name */
export function NameStep({ draft, set, next, back, progress }: StepProps) {
  const ok = draft.firstName.trim().length > 0 && draft.lastName.trim().length > 0;
  return (
    <StepShell title="Who is renting?" subtitle="Exactly as it appears on the driver license." onNext={next} onBack={back} canNext={ok} progress={progress}>
      <div className="grid sm:grid-cols-[1fr_1fr] gap-x-8 gap-y-6">
        <input className="field" placeholder="First name" autoComplete="off" value={draft.firstName} onChange={(e) => set({ firstName: e.target.value })} aria-label="First name" required />
        <input className="field" placeholder="Middle name (optional)" autoComplete="off" value={draft.middleName} onChange={(e) => set({ middleName: e.target.value })} aria-label="Middle name" />
        <input className="field sm:col-span-2" placeholder="Last name" autoComplete="off" value={draft.lastName} onChange={(e) => set({ lastName: e.target.value })} aria-label="Last name" required />
      </div>
    </StepShell>
  );
}

/* 4. Contact, with returning-customer detection */
export function ContactStep({ draft, set, next, back, progress, customers }: StepProps & { customers: Customer[] }) {
  const match = useMemo(() => {
    const e = draft.email.trim().toLowerCase();
    const p = draft.phone.replace(/\D/g, '');
    return customers.find((c) => (e && c.email.toLowerCase() === e) || (p.length >= 10 && c.phone.replace(/\D/g, '') === p));
  }, [customers, draft.email, draft.phone]);
  const ok = isEmail(draft.email) && draft.phone.replace(/\D/g, '').length >= 10;
  const blocked = match?.flags.includes('do-not-rent');

  const useFile = () => {
    if (!match) return;
    set({ customerId: match.id, firstName: match.firstName, middleName: match.middleName ?? '', lastName: match.lastName, dateOfBirth: match.dateOfBirth ?? '', license: match.license ?? draft.license, address: match.address, insurance: match.insurance ?? draft.insurance });
    tick();
    next();
  };

  return (
    <StepShell title={`How do we reach ${draft.firstName || 'them'}?`} subtitle="The signing link and the contract copy go here." onNext={blocked ? undefined : next} onBack={back} canNext={ok} progress={progress}>
      <div className="flex flex-col gap-6">
        <input className="field" type="tel" inputMode="tel" placeholder="Mobile phone" autoComplete="off" value={draft.phone} onChange={(e) => set({ phone: formatPhone(e.target.value) })} aria-label="Mobile phone" required />
        <input className="field" type="email" placeholder="Email" autoComplete="off" value={draft.email} onChange={(e) => set({ email: e.target.value })} aria-label="Email" required />
      </div>
      {match && !blocked && (
        <div className="mt-8 rounded-[var(--radius)] p-5 flex flex-wrap items-center justify-between gap-4" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <div>
            <p className="text-[15px] font-medium">{fullName(match)} is on file.</p>
            <p className="text-[13px]" style={{ color: 'var(--fg-3)' }}>{match.rentalCount} previous {match.rentalCount === 1 ? 'rental' : 'rentals'}. License, address, and insurance can be reused.</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={useFile}>Use their file</button>
        </div>
      )}
      {blocked && (
        <div role="alert" className="mt-8 rounded-[var(--radius)] p-5" style={{ background: 'color-mix(in oklab, var(--color-danger) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--color-danger) 40%, transparent)' }}>
          <p className="text-[15px] font-medium" style={{ color: 'var(--color-danger)' }}>Do not rent: {fullName(match!)}</p>
          <p className="text-[14px] mt-1" style={{ color: 'var(--fg-2)' }}>{match!.notes ?? 'This customer is flagged. Clear the flag in Customers to proceed.'}</p>
        </div>
      )}
    </StepShell>
  );
}

/* 5. Age and license */
export function LicenseStep({ draft, set, next, back, progress, vehicle, minAge }: StepProps & { vehicle: Vehicle; minAge: number }) {
  const required = Math.max(minAge, vehicle.minRenterAge);
  const age = draft.dateOfBirth ? ageOn(draft.dateOfBirth) : 0;
  const tooYoung = !!draft.dateOfBirth && age < required;
  const licOk = draft.license.number.trim().length >= 4 && !!draft.license.expires && new Date(draft.license.expires) > new Date();
  const ok = !!draft.dateOfBirth && !tooYoung && licOk;
  const [verified, setVerified] = useState(!!draft.license.verifiedAt);
  return (
    <StepShell title="Date of birth and license." subtitle={`This car requires renters ${required} or older. Match the license to the face in front of you and to the name on the card.`} onNext={next} onBack={back} canNext={ok && verified} progress={progress} wide>
      <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
        <Field label="Date of birth" htmlFor="dob" required error={tooYoung ? `${age} years old. Minimum for the ${vehicle.model} is ${required}.` : undefined} hint={draft.dateOfBirth && !tooYoung ? `${age} years old` : undefined}>
          <Input id="dob" type="date" value={draft.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ dateOfBirth: e.target.value })} invalid={tooYoung} />
        </Field>
        <Field label="License number" htmlFor="lic" required>
          <Input id="lic" value={draft.license.number} autoComplete="off" onChange={(e) => set({ license: { ...draft.license, number: e.target.value.toUpperCase() } })} className="font-mono" />
        </Field>
        <Field label="Issuing state" htmlFor="lst" required>
          <select id="lst" className="field-box" value={draft.license.state} onChange={(e) => set({ license: { ...draft.license, state: e.target.value } })}>{US_STATES.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Expires" htmlFor="lex" required error={draft.license.expires && new Date(draft.license.expires) <= new Date() ? 'This license has expired.' : undefined}>
          <Input id="lex" type="date" value={draft.license.expires} onChange={(e) => set({ license: { ...draft.license, expires: e.target.value } })} />
        </Field>
        <div className="sm:col-span-2 rounded-[var(--radius)] px-5" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          <Toggle id="ver" label="I checked the physical license against the renter and the payment card" description="Fake IDs and synthetic identities are the number one way exotic rentals are stolen. Feel the card, tilt the hologram, compare the face." checked={verified} onChange={(v) => { setVerified(v); set({ license: { ...draft.license, verifiedAt: v ? nowIso() : undefined } }); }} />
        </div>
      </div>
    </StepShell>
  );
}

/* 6. Address */
export function AddressStep({ draft, set, next, back, progress }: StepProps) {
  return (
    <StepShell title="Home address." subtitle="Start typing; pick the match. A local address with an out-of-state license is a fraud signal worth a question." onNext={next} onBack={back} canNext={!!draft.address?.line1 && !!draft.address?.city} progress={progress}>
      <AddressInput value={draft.address} onChange={(a) => set({ address: a })} autoFocus />
      {draft.address && draft.license.state && draft.address.state !== draft.license.state && (
        <p className="mt-5 text-[14px] inline-flex items-center gap-2" style={{ color: 'var(--color-warn)' }}><Warning aria-hidden className="size-4" /> Address in {draft.address.state}, license from {draft.license.state}. Ask why.</p>
      )}
    </StepShell>
  );
}

/* 7. Insurance */
export function InsuranceStep({ draft, set, next, back, progress, requirement }: StepProps & { requirement: 'renter-policy' | 'company-cdw' | 'either' }) {
  const ins = draft.insurance;
  const setIns = (p: Partial<typeof ins>) => set({ insurance: { ...ins, ...p } });
  const needsPolicy = ins.mode !== 'company-cdw';
  const ok = !needsPolicy || (!!ins.carrier && !!ins.policyNumber && !!ins.verifiedAt);
  return (
    <StepShell title="Who insures the car while it's out?" subtitle="Their policy must transfer to rental vehicles and be primary. Read the declarations page, do not take their word." onNext={next} onBack={back} canNext={ok} progress={progress} wide>
      <Choice
        value={ins.mode}
        onChange={(v) => setIns({ mode: v })}
        columns={3}
        options={[
          { value: 'renter-policy', label: "Renter's policy", hint: 'Full coverage, extends to rentals.', disabled: requirement === 'company-cdw' },
          { value: 'company-cdw', label: 'Our damage waiver', hint: 'Capped at a deductible.', disabled: requirement === 'renter-policy' },
          { value: 'both', label: 'Both', hint: 'Their policy first, waiver reduces the rest.' },
        ]}
      />
      {needsPolicy && (
        <div className="mt-8 grid sm:grid-cols-2 gap-x-10 gap-y-6">
          <Field label="Carrier" htmlFor="car" required><Input id="car" value={ins.carrier ?? ''} onChange={(e) => setIns({ carrier: e.target.value })} placeholder="Chubb, USAA, State Farm" /></Field>
          <Field label="Policy number" htmlFor="pol" required><Input id="pol" value={ins.policyNumber ?? ''} onChange={(e) => setIns({ policyNumber: e.target.value })} className="font-mono" /></Field>
          <Field label="Liability limits" htmlFor="lim" hint="100/300/100 minimum recommended"><Input id="lim" value={ins.liabilityLimits ?? ''} onChange={(e) => setIns({ liabilityLimits: e.target.value })} placeholder="100/300/100" /></Field>
          <Field label="Policy expires" htmlFor="pex"><Input id="pex" type="date" value={ins.expires ?? ''} onChange={(e) => setIns({ expires: e.target.value })} /></Field>
          <div className="sm:col-span-2 rounded-[var(--radius)] px-5" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <Toggle id="decl" label="I read the declarations page and it covers rental vehicles" description="Comprehensive and collision present, no rental exclusion, renter is a named insured." checked={!!ins.verifiedAt} onChange={(v) => setIns({ verifiedAt: v ? nowIso() : undefined, transfersToRental: v })} />
          </div>
        </div>
      )}
    </StepShell>
  );
}

/* 8. Additional drivers */
export function DriversStep({ draft, set, next, back, progress }: StepProps) {
  const [has, setHas] = useState<boolean | null>(draft.additionalDrivers.length ? true : null);
  const [f, setF] = useState({ firstName: '', lastName: '', number: '', state: 'TX', expires: '' });
  const firstRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (has) firstRef.current?.focus(); }, [has]);
  const add = () => {
    if (!f.firstName || !f.lastName || !f.number || !f.expires) return errorTone();
    set({ additionalDrivers: [...draft.additionalDrivers, { id: uid('drv'), firstName: f.firstName, lastName: f.lastName, license: { number: f.number, state: f.state, expires: f.expires }, fee: draft.fees.additionalDriverFee }] });
    setF({ firstName: '', lastName: '', number: '', state: 'TX', expires: '' });
    tick();
    firstRef.current?.focus();
  };
  const canNext = has === false || (has === true && draft.additionalDrivers.length > 0);
  return (
    <StepShell title="Will anyone else drive?" subtitle={`Anyone not named here is an unauthorized driver: coverage voids and it bills at $400 per day. Each additional driver is ${money(draft.fees.additionalDriverFee)}.`} onNext={next} onBack={back} canNext={canNext} progress={progress} wide>
      <YesNo value={has} onChange={(v) => { setHas(v); if (!v) set({ additionalDrivers: [] }); }} yes="Yes, add a driver" no="No, only the renter" />
      {has && (
        <div className="mt-8">
          {draft.additionalDrivers.length > 0 && (
            <ul className="mb-6 flex flex-col gap-2">
              {draft.additionalDrivers.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-4 rounded-[var(--radius)] px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                  <span className="text-[15px]">{d.firstName} {d.lastName} <span className="font-mono text-[13px]" style={{ color: 'var(--fg-3)' }}>{d.license.state} {d.license.number}</span></span>
                  <button aria-label="Remove driver" onClick={() => set({ additionalDrivers: draft.additionalDrivers.filter((x) => x.id !== d.id) })} className="size-8 inline-flex items-center justify-center rounded-full hover:bg-[var(--surface-2)]"><X className="size-4" /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="grid sm:grid-cols-6 gap-3">
            <input ref={firstRef} className="field-box sm:col-span-2" placeholder="First name" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} aria-label="First name" />
            <input className="field-box sm:col-span-2" placeholder="Last name" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} aria-label="Last name" />
            <input className="field-box sm:col-span-2 font-mono" placeholder="License number" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value.toUpperCase() })} aria-label="License number" />
            <select className="field-box sm:col-span-1" value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} aria-label="State">{US_STATES.map((s) => <option key={s}>{s}</option>)}</select>
            <input className="field-box sm:col-span-2" type="date" value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} aria-label="License expires" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); add(); } }} />
            <button className={cx('btn btn-ghost sm:col-span-3')} onClick={add}><Plus aria-hidden className="size-4" /> Add driver</button>
          </div>
        </div>
      )}
    </StepShell>
  );
}

export { MoneyInput };
