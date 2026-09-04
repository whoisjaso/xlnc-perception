import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { Check, Copy, Printer, PencilSimple } from '@phosphor-icons/react';
import { StepShell, Choice } from '@/components/wizard/StepShell';
import { SignaturePad } from '@/components/wizard/SignaturePad';
import { ContractDoc } from '@/components/admin/ContractDoc';
import { Toggle } from '@/components/ui';
import { useCustomers, useFleet, useRentals, useTemplates } from '@/store';
import { useWizard } from '@/store/wizard';
import type { StepProps, StepId } from './HandleRental';
import type { CompanySettings, Customer, Rental, Vehicle } from '@/lib/types';
import { buildRentalFromDraft, draftQuote } from '@/lib/buildRental';
import { quote } from '@/lib/pricing';
import { renderContractText } from '@/lib/contract';
import { formatAddress } from '@/lib/address';
import { appUrl, fullName, money, nowIso, sha256, uid, num } from '@/lib/util';
import { successChord, tick } from '@/lib/sound';

/* 20. Review */
export function ReviewStep({ draft, next, back, progress, vehicle, settings }: StepProps & { vehicle: Vehicle; settings: CompanySettings }) {
  const nav = useNavigate();
  const { terms } = draftQuote(draft, vehicle);
  terms.taxRate = settings.taxRate;
  const q = quote({ terms, additionalDriverCount: draft.additionalDrivers.length, additionalDriverFee: draft.fees.additionalDriverFee, depositAmount: draft.depositRequired ? draft.depositAmount : 0, downPayment: draft.downPayment, schedule: draft.schedule });
  const go = (s: StepId) => nav(`/admin/rental/new/${s}`);

  const rows: [string, string, StepId][] = [
    ['Vehicle', `${vehicle.year} ${vehicle.make} ${vehicle.model}, ${vehicle.color}`, 'vehicle'],
    ['Check-out', `${num(draft.odometerOut ?? vehicle.odometer)} mi, fuel ${Math.round(draft.fuelOut * 8)}/8, ${draft.damages.length} marks, ${draft.photos.length} photos`, 'condition'],
    ['Renter', fullName(draft) || 'Not provided', 'name'],
    ['Contact', [draft.phone, draft.email].filter(Boolean).join(', ') || 'Not provided', 'contact'],
    ['License', `${draft.license.state} ${draft.license.number}, expires ${draft.license.expires}`, 'license'],
    ['Address', formatAddress(draft.address) || 'Not provided', 'address'],
    ['Insurance', draft.insurance.mode === 'company-cdw' ? 'Our damage waiver' : `${[draft.insurance.carrier, draft.insurance.policyNumber].filter(Boolean).join(' ') || 'Not provided'}${draft.insurance.mode === 'both' ? ' plus waiver' : ''}`, 'insurance'],
    ['Additional drivers', draft.additionalDrivers.length ? draft.additionalDrivers.map((d) => `${d.firstName} ${d.lastName}`).join(', ') : 'None', 'drivers'],
    ['Term', `${draft.quantity} ${draft.unit}${draft.quantity === 1 ? '' : 's'}, ${format(new Date(terms.startAt), 'MMM d h:mm a')} to ${format(new Date(terms.endAt), 'MMM d h:mm a')}`, 'term'],
    ['Rate', `${money(terms.rate)} per ${draft.unit}${draft.discount ? `, ${money(draft.discount)} discount` : ''}`, 'rate'],
    ['Mileage', `${num(terms.includedMiles)} included, ${money(terms.overagePerMile, { cents: true })} per mile over`, 'mileage'],
    ['Deposit', draft.depositRequired ? `${money(draft.depositAmount)} by ${draft.depositMethod.replace('-', ' ')}` : 'None', 'deposit'],
    ['Payment', `${money(draft.downPayment)} today by ${draft.paymentMethod.replace(/-/g, ' ')}${draft.cardLast4 ? ` (${draft.cardBrand} ${draft.cardLast4})` : ''}, then ${draft.schedule}`, 'payment-method'],
    ['Renewal', draft.renewalIntent === 'none' ? 'Not expected' : `${draft.renewalIntent.replace('-', ' ')} at ${money(draft.renewalRate || terms.rate)} per ${draft.unit}`, 'renewal'],
    ['Delivery', draft.deliveryEnabled ? `${formatAddress(draft.deliveryAddress)}, ${money(draft.deliveryFee)}${draft.returnPickup ? ', collected at return' : ''}` : 'Pickup at the lot', 'delivery'],
    ['Rules', `${draft.rules.geographicLimit} limit, GPS ${draft.rules.gpsConsent ? 'disclosed' : 'not disclosed'}, ${draft.rules.petsAllowed ? 'pets ok' : 'no pets'}`, 'rules'],
  ];

  return (
    <StepShell title="Everything in one place." subtitle="Tap any line to change it. The contract is generated from exactly this." onNext={next} onBack={back} nextLabel="Generate the contract" progress={progress} wide>
      <div className="grid md:grid-cols-[1fr_320px] gap-10 items-start">
        <dl className="rounded-[var(--radius)] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
          {rows.map(([k, v, s], i) => (
            <button key={k} onClick={() => go(s)} className="group w-full grid grid-cols-[130px_1fr_auto] gap-4 items-start text-left px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)]" style={{ borderTop: i ? '1px solid var(--line)' : undefined }}>
              <dt className="text-[13px] font-medium pt-0.5" style={{ color: 'var(--fg-3)' }}>{k}</dt>
              <dd className="text-[15px]">{v}</dd>
              <PencilSimple aria-hidden className="size-4 opacity-0 group-hover:opacity-60 transition-opacity mt-0.5" />
            </button>
          ))}
        </dl>
        <div className="rounded-[var(--radius-lg)] p-6 md:sticky md:top-6" style={{ background: '#0f1012', color: '#f4f2ee' }}>
          <p className="label-caps" style={{ color: 'rgb(244 242 238 / 0.5)' }}>Money</p>
          <dl className="mt-4 flex flex-col gap-2 text-[14px] tabular">
            <Line k={`${draft.quantity} × ${money(terms.rate)}`} v={money(q.base)} />
            {q.deliveryFee > 0 && <Line k="Delivery" v={money(q.deliveryFee)} />}
            {q.additionalDrivers > 0 && <Line k="Additional drivers" v={money(q.additionalDrivers)} />}
            {q.discount > 0 && <Line k="Discount" v={`(${money(q.discount)})`} />}
            <Line k={`Tax ${(settings.taxRate * 100).toFixed(2)}%`} v={money(q.tax, { cents: true })} />
            <div className="h-px my-1" style={{ background: 'rgb(244 242 238 / 0.15)' }} />
            <Line k="Rental total" v={money(q.total, { cents: true })} strong />
            {q.deposit > 0 && <Line k="Deposit" v={money(q.deposit)} />}
            <div className="h-px my-1" style={{ background: 'rgb(244 242 238 / 0.15)' }} />
            <Line k="Due today" v={money(q.dueToday, { cents: true })} strong />
            {q.balance > 0 && <Line k="Balance scheduled" v={money(q.balance, { cents: true })} />}
          </dl>
        </div>
      </div>
    </StepShell>
  );
}

function Line({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt style={{ color: strong ? '#f4f2ee' : 'rgb(244 242 238 / 0.65)' }} className={strong ? 'font-medium' : ''}>{k}</dt>
      <dd className={strong ? 'font-medium text-[16px]' : ''}>{v}</dd>
    </div>
  );
}

/* 21. Contract and signatures */
export function SignStep({ draft, set, next, back, progress, vehicle, settings }: StepProps & { vehicle: Vehicle; settings: CompanySettings }) {
  const customers = useCustomers();
  const rentals = useRentals();
  const template = useTemplates((s) => s.byId(draft.templateId ?? '') ?? s.getDefault());
  const [rental, setRental] = useState<Rental | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [mode, setMode] = useState<'in-person' | 'remote-link' | undefined>(draft.signingMode);
  const [consent, setConsent] = useState(false);
  const [renterSig, setRenterSig] = useState<string | null>(null);
  const [dealerSig, setDealerSig] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Materialize customer + rental once when this screen opens.
  useEffect(() => {
    const now = nowIso();
    const existing = draft.customerId ? customers.byId(draft.customerId) : customers.findByEmailOrPhone(draft.email, draft.phone);
    const c: Customer = existing
      ? { ...existing, firstName: draft.firstName, middleName: draft.middleName || undefined, lastName: draft.lastName, email: draft.email, phone: draft.phone, dateOfBirth: draft.dateOfBirth, address: draft.address, license: draft.license, insurance: draft.insurance, updatedAt: now }
      : { id: uid('cus'), firstName: draft.firstName, middleName: draft.middleName || undefined, lastName: draft.lastName, email: draft.email, phone: draft.phone, dateOfBirth: draft.dateOfBirth, address: draft.address, license: draft.license, insurance: draft.insurance, flags: [], rentalCount: 0, lifetimeValue: 0, createdAt: now, updatedAt: now };
    customers.upsert(c);
    const existingRental = draft.rentalId ? rentals.byId(draft.rentalId) : undefined;
    const number = existingRental?.number ?? rentals.nextNumber();
    const r = buildRentalFromDraft({ draft, vehicle, customer: c, settings, number, templateId: template.id });
    if (existingRental) { r.signatures = existingRental.signatures; r.timeline = existingRental.timeline; r.signingToken = existingRental.signingToken; }
    void sha256(renderContractText({ rental: r, vehicle, customer: c, company: settings, template })).then((hash) => {
      const withHash = { ...r, contract: { ...r.contract!, hash } };
      rentals.upsert(withHash);
      setRental(withHash);
    });
    setCustomer(c);
    set({ customerId: c.id, rentalId: r.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctx = useMemo(() => (rental && customer ? { rental, vehicle, customer, company: settings, template } : null), [rental, customer, vehicle, settings, template]);
  const link = rental?.signingToken ? appUrl(`/sign/${rental.signingToken}`) : '';

  const sendRemote = () => {
    if (!rental) return;
    const token = rental.signingToken ?? uid('sig') + Math.random().toString(36).slice(2, 8);
    const expires = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
    const next = { ...rental, status: 'awaiting-signature' as const, signingToken: token, signingExpiresAt: expires, timeline: [...rental.timeline, { id: uid('ev'), at: nowIso(), type: 'sent-for-signature' as const, summary: `Signing link created for ${draft.phone}` }] };
    rentals.upsert(next);
    setRental(next);
    set({ signingMode: 'remote-link' });
    tick();
  };

  const finishInPerson = () => {
    if (!rental || !renterSig || !dealerSig) return;
    const at = nowIso();
    const nextR: Rental = {
      ...rental,
      status: 'signed',
      signatures: [
        { role: 'renter', name: fullName(draft), dataUrl: renterSig, signedAt: at, method: 'in-person', consentToElectronicRecords: true, userAgent: navigator.userAgent },
        { role: 'dealer', name: settings.dba || settings.legalName, dataUrl: dealerSig, signedAt: at, method: 'in-person', consentToElectronicRecords: true },
      ],
      timeline: [...rental.timeline, { id: uid('ev'), at, type: 'signed-renter', summary: 'Renter signed in person' }, { id: uid('ev'), at, type: 'signed-dealer', summary: 'Owner countersigned' }],
    };
    rentals.upsert(nextR);
    set({ signingMode: 'in-person' });
    successChord();
    next('done');
  };

  const canFinish = !!consent && !!renterSig && !!dealerSig;

  return (
    <StepShell
      title={rental ? `Agreement ${rental.number}` : 'Preparing the agreement'}
      subtitle="Read it with the renter. Every section carries its plain-language line. Then sign here, or send a link to their phone."
      onBack={back}
      onNext={mode === 'in-person' ? finishInPerson : mode === 'remote-link' && rental?.signingToken ? () => next('done') : undefined}
      canNext={mode === 'in-person' ? canFinish : true}
      nextLabel={mode === 'in-person' ? 'Complete signing' : 'Done for now'}
      progress={progress}
      wide
      footer={ctx && <button className="btn btn-quiet" onClick={() => window.print()}><Printer aria-hidden className="size-4" /> Print</button>}
    >
      {ctx && (
        <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">
          <div className="rounded-[var(--radius-lg)] p-6 md:p-10 max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible print-page" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <ContractDoc ctx={ctx} />
          </div>
          <div className="flex flex-col gap-6 no-print lg:sticky lg:top-6">
            <Choice
              value={mode}
              onChange={(v) => { setMode(v); if (v === 'remote-link') sendRemote(); }}
              columns={1}
              options={[
                { value: 'in-person', label: 'Sign here, now', hint: 'Renter signs on this screen, you countersign.' },
                { value: 'remote-link', label: 'Send a signing link', hint: 'Renter reviews and signs on their phone. Expires in 72 hours.' },
              ]}
            />
            {mode === 'in-person' && (
              <div className="flex flex-col gap-5">
                <Toggle id="consent" label="Renter consents to electronic signature and has received the plain-language summary" checked={consent} onChange={setConsent} />
                <div>
                  <p className="text-[13px] font-medium mb-2" style={{ color: 'var(--fg-2)' }}>Renter: {fullName(draft)}</p>
                  <SignaturePad onChange={setRenterSig} />
                </div>
                <div>
                  <p className="text-[13px] font-medium mb-2" style={{ color: 'var(--fg-2)' }}>Owner: {settings.dba}</p>
                  <SignaturePad onChange={setDealerSig} label="Countersign" />
                </div>
              </div>
            )}
            {mode === 'remote-link' && link && (
              <div className="rounded-[var(--radius)] p-5" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
                <p className="text-[14px] font-medium">Signing link</p>
                <p className="mt-2 text-[13px] break-all font-mono" style={{ color: 'var(--fg-2)' }}>{link}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn btn-primary btn-sm" onClick={() => { void navigator.clipboard?.writeText(link); setCopied(true); tick(); setTimeout(() => setCopied(false), 1800); }}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copied' : 'Copy link'}</button>
                  <a className="btn btn-ghost btn-sm" href={`sms:${draft.phone.replace(/\D/g, '')}?&body=${encodeURIComponent(`${settings.dba}: your rental agreement ${rental?.number} is ready to review and sign: ${link}`)}`}>Text it</a>
                  <a className="btn btn-ghost btn-sm" href={`mailto:${draft.email}?subject=${encodeURIComponent(`Your ${settings.dba} rental agreement ${rental?.number}`)}&body=${encodeURIComponent(`Review and sign here: ${link}`)}`}>Email it</a>
                </div>
                <p className="mt-3 text-[13px]" style={{ color: 'var(--fg-3)' }}>The rental shows as awaiting signature until they finish. You countersign from the rental page.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </StepShell>
  );
}

/* 22. Done */
export function DoneStep({ draft }: StepProps) {
  const nav = useNavigate();
  const rentals = useRentals();
  const fleet = useFleet();
  const clear = useWizard((s) => s.clear);
  const rental = draft.rentalId ? rentals.byId(draft.rentalId) : undefined;
  const vehicle = rental ? fleet.byId(rental.vehicleId) : undefined;
  const signed = rental?.status === 'signed' || rental?.status === 'active';

  const checkOut = () => {
    if (!rental || !vehicle) return;
    rentals.upsert({ ...rental, status: 'active', checkout: { ...(rental.checkout ?? { at: nowIso(), odometer: vehicle.odometer, fuelLevel: 1, damages: [], photos: [] }), at: nowIso() }, timeline: [...rental.timeline, { id: uid('ev'), at: nowIso(), type: 'checked-out', summary: `Checked out at ${num(rental.checkout?.odometer ?? vehicle.odometer)} mi` }] });
    fleet.upsert({ ...vehicle, status: 'rented', odometer: rental.checkout?.odometer ?? vehicle.odometer });
    successChord();
    clear();
    nav(`/admin/rentals/${rental.id}`);
  };

  return (
    <StepShell
      title={signed ? 'Signed. Hand over the keys.' : 'Sent. Waiting on the renter.'}
      subtitle={rental ? `${rental.number}${vehicle ? `, ${vehicle.year} ${vehicle.make} ${vehicle.model}` : ''}. ${signed ? 'Check the car out now to start the clock and move it to rented.' : 'When they sign, the rental appears on the hub for countersignature and check-out.'}` : ''}
      progress={1}
    >
      <div className="flex flex-wrap gap-3">
        {signed && <button className="btn btn-accent btn-lg" onClick={checkOut} data-autofocus>Check out now</button>}
        {rental && <Link to={`/admin/rentals/${rental.id}`} className="btn btn-ghost btn-lg" onClick={clear}>Open the rental</Link>}
        <button className="btn btn-quiet btn-lg" onClick={() => { clear(); nav('/admin'); }}>Back to the hub</button>
      </div>
    </StepShell>
  );
}
