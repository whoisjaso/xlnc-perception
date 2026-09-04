import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { addDays, addMonths, addWeeks, format, formatDistanceToNow } from 'date-fns';
import { Printer, Copy, Check, LinkSimple } from '@phosphor-icons/react';
import { Page, PageHeader } from '@/components/admin/AdminLayout';
import { Button, Field, Input, MoneyInput, Pill, Select, Textarea, Toggle } from '@/components/ui';
import { ContractDoc } from '@/components/admin/ContractDoc';
import { SignaturePad } from '@/components/wizard/SignaturePad';
import { useCustomers, useFleet, useRentals, useSettings, useTemplates } from '@/store';
import { useWizard } from '@/store/wizard';
import { STATUS_LABEL, STATUS_TONE } from './Rentals';
import type { Deduction, Installment, PaymentMethod, Rental } from '@/lib/types';
import { fuelCharge, lateCharge, mileageOverage } from '@/lib/pricing';
import { formatAddress } from '@/lib/address';
import { fullName, money, nowIso, num, uid, cx } from '@/lib/util';
import { successChord, tick } from '@/lib/sound';

type Tab = 'overview' | 'money' | 'contract' | 'checkin' | 'timeline';

export function RentalDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const rentals = useRentals();
  const fleet = useFleet();
  const customers = useCustomers();
  const settings = useSettings((s) => s.settings);
  const templates = useTemplates();
  const r = rentals.byId(id ?? '');
  const v = r ? fleet.byId(r.vehicleId) : undefined;
  const c = r ? customers.byId(r.customerId) : undefined;
  const [tab, setTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);

  const ctx = useMemo(() => (r && v && c ? { rental: r, vehicle: v, customer: c, company: settings, template: templates.byId(r.contract?.templateId ?? '') ?? templates.getDefault() } : null), [r, v, c, settings, templates]);

  if (!r) return <Page><p>Rental not found.</p><Link to="/admin/rentals" className="btn btn-ghost mt-6">All rentals</Link></Page>;

  const paid = r.installments.reduce((s, i) => s + i.paidAmount, 0);
  const total = r.installments.reduce((s, i) => s + i.amount, 0);
  const link = r.signingToken ? `${window.location.origin}/sign/${r.signingToken}` : '';
  const renterSigned = r.signatures.some((s) => s.role === 'renter');
  const dealerSigned = r.signatures.some((s) => s.role === 'dealer');

  const patch = (fn: (x: Rental) => Rental) => rentals.patch(r.id, fn);
  const log = (type: Rental['timeline'][number]['type'], summary: string) => rentals.log(r.id, { type, summary });

  const checkOut = () => {
    if (!v) return;
    patch((x) => ({ ...x, status: 'active', checkout: { ...(x.checkout ?? { odometer: v.odometer, fuelLevel: 1, damages: [], photos: [] }), at: nowIso() } }));
    fleet.upsert({ ...v, status: 'rented' });
    log('checked-out', `Checked out at ${num(r.checkout?.odometer ?? v.odometer)} mi`);
    successChord();
  };

  const resumeDraft = () => {
    useWizard.getState().start(r.fees, r.rules, {
      rentalId: r.id, vehicleId: r.vehicleId, customerId: r.customerId, odometerOut: r.checkout?.odometer, fuelOut: r.checkout?.fuelLevel ?? 1, damages: r.checkout?.damages ?? [], photos: r.checkout?.photos ?? [],
      firstName: c?.firstName ?? '', middleName: c?.middleName ?? '', lastName: c?.lastName ?? '', phone: c?.phone ?? '', email: c?.email ?? '', dateOfBirth: c?.dateOfBirth ?? '', license: c?.license ?? { number: '', state: 'TX', expires: '' }, address: c?.address, insurance: c?.insurance ?? { mode: 'renter-policy' },
      additionalDrivers: r.additionalDrivers, startAt: r.terms.startAt, unit: r.terms.unit, quantity: r.terms.quantity, rate: r.terms.rate, includedMilesPerDay: Math.round(r.terms.includedMiles / Math.max(1, r.terms.quantity * (r.terms.unit === 'day' ? 1 : r.terms.unit === 'week' ? 7 : 30))), overagePerMile: r.terms.overagePerMile, discount: r.terms.discount,
      depositRequired: r.deposit.required, depositAmount: r.deposit.amount, depositMethod: r.deposit.method === 'none' ? 'card-hold' : r.deposit.method, collateralDescription: r.deposit.collateralDescription ?? '', downPayment: r.payment.downPayment, paymentMethod: r.payment.method, cardLast4: r.payment.cardLast4 ?? '', cardBrand: r.payment.cardBrand ?? '', cardOnFileAuthorized: r.payment.cardOnFileAuthorized, riskAcknowledged: !!r.payment.riskAcknowledged, schedule: r.payment.schedule, renewalIntent: r.terms.renewalIntent, renewalRate: r.terms.renewalRate ?? 0,
      deliveryEnabled: !!r.terms.delivery?.enabled, deliveryAddress: r.terms.delivery?.address, deliveryFee: r.terms.delivery?.fee ?? 0, returnPickup: !!r.terms.delivery?.returnPickup, templateId: r.contract?.templateId,
    });
    nav('/admin/rental/new/review');
  };

  const cancel = () => {
    if (!window.confirm(`Cancel ${r.number}? This cannot be undone.`)) return;
    patch((x) => ({ ...x, status: 'cancelled' }));
    if (v && v.status === 'reserved') fleet.upsert({ ...v, status: 'available' });
    log('cancelled', 'Rental cancelled');
  };

  const tabs: [Tab, string][] = [['overview', 'Overview'], ['money', 'Money'], ['contract', 'Contract'], ['checkin', r.checkin ? 'Return' : 'Check in'], ['timeline', 'Timeline']];

  return (
    <Page wide>
      <title>{`${r.number}. Nova Wheels`}</title>
      <PageHeader
        title={`${r.number}`}
        subtitle={v && c ? `${v.year} ${v.make} ${v.model} · ${fullName(c)}` : ''}
        actions={
          <>
            <Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Pill>
            {r.status === 'draft' && <Button variant="accent" size="sm" onClick={resumeDraft}>Resume</Button>}
            {r.status === 'signed' && <Button variant="accent" size="sm" onClick={checkOut}>Check out</Button>}
            {['active', 'extended', 'overdue'].includes(r.status) && <Button variant="accent" size="sm" onClick={() => setTab('checkin')}>Check in</Button>}
            {['draft', 'awaiting-signature', 'signed'].includes(r.status) && <Button variant="quiet" size="sm" onClick={cancel}>Cancel</Button>}
          </>
        }
      />

      <div role="tablist" aria-label="Rental sections" className="flex gap-1 mb-8 overflow-x-auto">
        {tabs.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('h-9 px-4 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors', tab === k ? 'bg-[var(--fg)] text-[var(--bg)]' : 'hover:bg-[var(--surface-2)]')}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid md:grid-cols-[1fr_340px] gap-8 items-start">
          <div className="flex flex-col gap-6">
            <Card title="Term">
              <Grid rows={[
                ['Pickup', format(new Date(r.terms.startAt), "EEE, MMM d 'at' h:mm a")],
                ['Return', format(new Date(r.terms.endAt), "EEE, MMM d 'at' h:mm a")],
                ['Length', `${r.terms.quantity} ${r.terms.unit}${r.terms.quantity === 1 ? '' : 's'}`],
                ['Rate', `${money(r.terms.rate)} per ${r.terms.unit}`],
                ['Mileage', `${num(r.terms.includedMiles)} included, ${money(r.terms.overagePerMile, { cents: true })}/mi over`],
                ['Delivery', r.terms.delivery?.enabled ? formatAddress(r.terms.delivery.address) : 'Lot pickup'],
                ['Renewal', r.terms.renewalIntent === 'none' ? 'Not expected' : `${r.terms.renewalIntent} at ${money(r.terms.renewalRate ?? r.terms.rate)}`],
              ]} />
              {['active', 'extended', 'overdue'].includes(r.status) && <ExtendForm r={r} onExtend={(newEnd, amount, note) => {
                patch((x) => ({ ...x, status: 'extended', terms: { ...x.terms, endAt: newEnd }, extensions: [...x.extensions, { at: nowIso(), newEndAt: newEnd, addedAmount: amount, note }], installments: [...x.installments, { id: uid('inst'), dueAt: nowIso(), amount, label: `Extension to ${format(new Date(newEnd), 'MMM d')}`, status: 'due', paidAmount: 0 }] }));
                log('extension', `Extended to ${format(new Date(newEnd), 'MMM d, h a')} for ${money(amount)}`);
                tick();
              }} />}
            </Card>
            <Card title="Renter">
              {c && <Grid rows={[
                ['Name', fullName(c)],
                ['Phone', c.phone],
                ['Email', c.email],
                ['Address', formatAddress(c.address)],
                ['License', c.license ? `${c.license.state} ${c.license.number}, exp ${c.license.expires}${c.license.verifiedAt ? ' (verified)' : ''}` : 'Not on file'],
                ['Insurance', c.insurance?.mode === 'company-cdw' ? 'Our damage waiver' : `${c.insurance?.carrier ?? ''} ${c.insurance?.policyNumber ?? ''} ${c.insurance?.liabilityLimits ?? ''}`.trim() || 'Not on file'],
                ['Additional drivers', r.additionalDrivers.length ? r.additionalDrivers.map((d) => `${d.firstName} ${d.lastName}`).join(', ') : 'None'],
              ]} />}
              {c && <Link to={`/admin/customers/${c.id}`} className="inline-block mt-4 text-[14px] underline underline-offset-4" style={{ color: 'var(--fg-2)' }}>Customer file</Link>}
            </Card>
            <Card title="Check-out condition">
              {r.checkout ? (
                <>
                  <Grid rows={[['Recorded', format(new Date(r.checkout.at), 'MMM d, h:mm a')], ['Odometer', `${num(r.checkout.odometer)} mi`], ['Fuel', `${Math.round(r.checkout.fuelLevel * 8)}/8`], ['Marks', r.checkout.damages.length ? r.checkout.damages.map((d) => `${d.zone.replace(/-/g, ' ')} (${d.severity})`).join(', ') : 'None noted']]} />
                  {r.checkout.photos.length > 0 && <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-2">{r.checkout.photos.map((p) => <img key={p.id} src={p.dataUrl ?? p.url} alt={p.label} className="aspect-square object-cover rounded-md" />)}</div>}
                </>
              ) : <p style={{ color: 'var(--fg-3)' }}>Not recorded.</p>}
            </Card>
          </div>
          <div className="flex flex-col gap-6">
            <div className="rounded-[var(--radius-lg)] p-6" style={{ background: '#0f1012', color: '#f4f2ee' }}>
              <p className="label-caps" style={{ color: 'rgb(244 242 238 / 0.5)' }}>Money</p>
              <p className="font-display text-[40px] leading-none mt-3 tabular">{money(paid, { cents: true })}</p>
              <p className="text-[13px] mt-1" style={{ color: 'rgb(244 242 238 / 0.6)' }}>collected of {money(total, { cents: true })}</p>
              <div className="h-1 rounded-full mt-4 overflow-hidden" style={{ background: 'rgb(244 242 238 / 0.15)' }}><div className="h-full" style={{ width: `${Math.min(100, (paid / Math.max(1, total)) * 100)}%`, background: '#f4f2ee' }} /></div>
              <p className="text-[13px] mt-4" style={{ color: 'rgb(244 242 238 / 0.6)' }}>Deposit {r.deposit.required ? `${money(r.deposit.amount)} (${r.deposit.method.replace('-', ' ')})` : 'none'}</p>
              {r.deductions.length > 0 && <p className="text-[13px] mt-1" style={{ color: 'rgb(244 242 238 / 0.6)' }}>Deductions {money(r.deductions.reduce((s, d) => s + d.amount, 0), { cents: true })}</p>}
            </div>
            <Card title="Signatures">
              <ul className="flex flex-col gap-2 text-[14px]">
                <li className="flex justify-between"><span>Renter</span>{renterSigned ? <Pill tone="ok">Signed {format(new Date(r.signatures.find((s) => s.role === 'renter')!.signedAt), 'MMM d')}</Pill> : <Pill tone="warn">Pending</Pill>}</li>
                <li className="flex justify-between"><span>Owner</span>{dealerSigned ? <Pill tone="ok">Signed</Pill> : <Pill tone="warn">Pending</Pill>}</li>
              </ul>
              {link && !renterSigned && (
                <div className="mt-4">
                  <p className="text-[12px] font-mono break-all" style={{ color: 'var(--fg-3)' }}>{link}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { void navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? 'Copied' : 'Copy'}</Button>
                    <a className="btn btn-ghost btn-sm" href={link} target="_blank" rel="noreferrer"><LinkSimple className="size-4" /> Open</a>
                  </div>
                </div>
              )}
              {renterSigned && !dealerSigned && <Countersign onSign={(dataUrl) => { patch((x) => ({ ...x, status: x.status === 'awaiting-signature' ? 'signed' : x.status, signatures: [...x.signatures, { role: 'dealer', name: settings.dba, dataUrl, signedAt: nowIso(), method: 'in-person', consentToElectronicRecords: true }] })); log('signed-dealer', 'Owner countersigned'); successChord(); }} />}
            </Card>
            {v?.gps && (
              <Card title="Tracking">
                <Grid rows={[['Provider', v.gps.provider ?? 'Not set'], ['Device', v.gps.deviceId ?? 'Not set'], ['Starter interrupt', v.gps.starterInterrupt ? (r.rules.starterInterruptConsent ? 'Installed, consented' : 'Installed, not consented') : 'Not installed']]} />
                {v.gps.starterInterrupt && ['active', 'extended', 'overdue', 'non-return'].includes(r.status) && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { log('starter-disabled', 'Starter interrupt engaged by owner'); tick(); }}>Disable starter</Button>
                    <Button size="sm" variant="quiet" onClick={() => { log('starter-enabled', 'Starter interrupt released'); tick(); }}>Release</Button>
                  </div>
                )}
                {['active', 'extended', 'overdue'].includes(r.status) && new Date(r.terms.endAt) < new Date() && (
                  <Button className="mt-3" size="sm" variant="ghost" onClick={() => { if (window.confirm('Declare non-return? This records the time for the police report and starts recovery.')) { patch((x) => ({ ...x, status: 'non-return' })); log('non-return-declared', 'Non-return declared. 24h past return time with no written extension.'); } }}>Declare non-return</Button>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'money' && <MoneyTab r={r} onPay={(inst, amount, method, ref) => {
        patch((x) => ({ ...x, installments: x.installments.map((i) => i.id === inst.id ? { ...i, paidAmount: i.paidAmount + amount, status: i.paidAmount + amount >= i.amount - 0.01 ? 'paid' : 'partial', paidAt: nowIso(), method, reference: ref || undefined } : i) }));
        log('payment', `${money(amount, { cents: true })} received by ${method.replace(/-/g, ' ')} for ${inst.label}`);
        if (c) customers.upsert({ ...c, lifetimeValue: c.lifetimeValue + amount });
        successChord();
      }} onDeduct={(d) => { patch((x) => ({ ...x, deductions: [...x.deductions, d] })); log('deduction', `${d.category}: ${money(d.amount, { cents: true })}. ${d.note}`); tick(); }} onReleaseDeposit={() => { log('deposit-released', `Deposit released less ${money(r.deductions.reduce((s, d) => s + d.amount, 0), { cents: true })} in deductions`); patch((x) => ({ ...x, status: 'closed' })); successChord(); }} />}

      {tab === 'contract' && ctx && (
        <div>
          <div className="flex justify-end mb-4 no-print"><Button variant="ghost" size="sm" onClick={() => window.print()}><Printer className="size-4" /> Print or save as PDF</Button></div>
          <div className="rounded-[var(--radius-lg)] p-6 md:p-12 print-page" style={{ background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <ContractDoc ctx={ctx} />
          </div>
          {r.contract?.hash && <p className="mt-3 text-[12px] font-mono break-all" style={{ color: 'var(--fg-3)' }}>Document hash {r.contract.hash}</p>}
        </div>
      )}

      {tab === 'checkin' && <CheckInTab r={r} onCheckIn={(snap, charges) => {
        patch((x) => ({ ...x, status: 'returned', checkin: snap, deductions: [...x.deductions, ...charges] }));
        if (v) fleet.upsert({ ...v, status: 'available', odometer: snap.odometer });
        log('checked-in', `Returned at ${num(snap.odometer)} mi, fuel ${Math.round(snap.fuelLevel * 8)}/8. ${charges.length ? `${charges.length} charges totaling ${money(charges.reduce((s, d) => s + d.amount, 0), { cents: true })}` : 'No charges'}`);
        if (c) customers.upsert({ ...c, rentalCount: c.rentalCount + 1 });
        successChord();
        setTab('money');
      }} />}

      {tab === 'timeline' && (
        <Card title="Timeline">
          <ol className="flex flex-col">
            {[...r.timeline].reverse().map((e, i) => (
              <li key={e.id} className="grid grid-cols-[150px_1fr] gap-4 py-3 text-[14px]" style={{ borderTop: i ? '1px solid var(--line)' : undefined }}>
                <span className="tabular" style={{ color: 'var(--fg-3)' }}>{format(new Date(e.at), 'MMM d, h:mm a')}</span>
                <span><span className="font-medium">{e.type.replace(/-/g, ' ')}</span> <span style={{ color: 'var(--fg-2)' }}>{e.summary}</span></span>
              </li>
            ))}
          </ol>
          <NoteForm onAdd={(n) => { log('note', n); tick(); }} />
        </Card>
      )}
    </Page>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
      <h2 className="text-[15px] font-medium mb-4">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-[14px]">
      {rows.map(([k, v]) => (<div key={k} className="contents"><dt style={{ color: 'var(--fg-3)' }}>{k}</dt><dd>{v || 'Not set'}</dd></div>))}
    </dl>
  );
}

function ExtendForm({ r, onExtend }: { r: Rental; onExtend: (newEnd: string, amount: number, note?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const rate = r.terms.renewalRate ?? r.terms.rate;
  const end = new Date(r.terms.endAt);
  const newEnd = r.terms.unit === 'day' ? addDays(end, qty) : r.terms.unit === 'week' ? addWeeks(end, qty) : addMonths(end, qty);
  const amount = Math.round(rate * qty * (1 + r.terms.taxRate) * 100) / 100;
  if (!open) return <Button className="mt-4" size="sm" variant="ghost" onClick={() => setOpen(true)}>Extend</Button>;
  return (
    <div className="mt-5 rounded-[var(--radius)] p-4 flex flex-wrap items-end gap-4" style={{ background: 'var(--surface-2)' }}>
      <Field label={`Additional ${r.terms.unit}s`} htmlFor="ext"><Input id="ext" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="w-24" /></Field>
      <p className="text-[14px] pb-3">to {format(newEnd, 'MMM d, h a')} for <span className="font-medium tabular">{money(amount, { cents: true })}</span> incl. tax, due now</p>
      <Button size="sm" variant="accent" onClick={() => { onExtend(newEnd.toISOString(), amount); setOpen(false); }}>Confirm extension</Button>
    </div>
  );
}

function Countersign({ onSign }: { onSign: (dataUrl: string) => void }) {
  const [sig, setSig] = useState<string | null>(null);
  return (
    <div className="mt-4">
      <SignaturePad onChange={setSig} label="Countersign" />
      <Button className="mt-3" size="sm" variant="accent" disabled={!sig} onClick={() => sig && onSign(sig)}>Countersign</Button>
    </div>
  );
}

function NoteForm({ onAdd }: { onAdd: (n: string) => void }) {
  const [n, setN] = useState('');
  return (
    <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (n.trim()) { onAdd(n.trim()); setN(''); } }}>
      <Input placeholder="Add a note to the record" value={n} onChange={(e) => setN(e.target.value)} />
      <Button type="submit" variant="ghost">Add</Button>
    </form>
  );
}

function MoneyTab({ r, onPay, onDeduct, onReleaseDeposit }: { r: Rental; onPay: (i: Installment, amount: number, method: PaymentMethod, ref: string) => void; onDeduct: (d: Deduction) => void; onReleaseDeposit: () => void }) {
  const [paying, setPaying] = useState<Installment | null>(null);
  const [amt, setAmt] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>(r.payment.method);
  const [ref, setRef] = useState('');
  const [d, setD] = useState<{ category: Deduction['category']; amount: number; note: string }>({ category: 'damage', amount: 0, note: '' });
  const now = new Date();
  const deductionTotal = r.deductions.reduce((s, x) => s + x.amount, 0);
  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card title="Installments">
        <ol className="flex flex-col">
          {r.installments.map((i, n) => {
            const overdue = i.status !== 'paid' && new Date(i.dueAt) < now;
            return (
              <li key={i.id} className="flex items-center justify-between gap-4 py-3 text-[14px]" style={{ borderTop: n ? '1px solid var(--line)' : undefined }}>
                <div>
                  <p className="font-medium">{i.label}</p>
                  <p style={{ color: 'var(--fg-3)' }}>{format(new Date(i.dueAt), 'MMM d, yyyy')}{i.paidAt ? ` · paid ${format(new Date(i.paidAt), 'MMM d')} by ${i.method?.replace(/-/g, ' ')}` : ''}{i.reference ? ` · ${i.reference}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular font-medium">{money(i.amount, { cents: true })}</span>
                  {i.status === 'paid' ? <Pill tone="ok">Paid</Pill> : <Button size="sm" variant={overdue ? 'accent' : 'ghost'} onClick={() => { setPaying(i); setAmt(Math.round((i.amount - i.paidAmount) * 100) / 100); }}>{overdue ? 'Overdue, collect' : i.status === 'partial' ? 'Collect balance' : 'Collect'}</Button>}
                </div>
              </li>
            );
          })}
        </ol>
        {paying && (
          <form className="mt-5 rounded-[var(--radius)] p-4 grid sm:grid-cols-2 gap-4" style={{ background: 'var(--surface-2)' }} onSubmit={(e) => { e.preventDefault(); onPay(paying, amt, method, ref); setPaying(null); setRef(''); }}>
            <Field label="Amount" htmlFor="pa"><MoneyInput id="pa" value={amt} onChange={setAmt} /></Field>
            <Field label="Method" htmlFor="pm"><Select id="pm" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>{['card-on-file', 'ach', 'wire', 'cash', 'zelle', 'cashapp', 'crypto', 'other'].map((m) => <option key={m} value={m}>{m.replace(/-/g, ' ')}</option>)}</Select></Field>
            <Field label="Reference" htmlFor="pr" hint="Charge ID, confirmation number, or receipt number"><Input id="pr" value={ref} onChange={(e) => setRef(e.target.value)} /></Field>
            <div className="self-end flex gap-2"><Button type="submit" variant="accent">Record payment</Button><Button type="button" variant="quiet" onClick={() => setPaying(null)}>Cancel</Button></div>
          </form>
        )}
      </Card>
      <div className="flex flex-col gap-6">
        <Card title="Deposit and deductions">
          <p className="text-[14px]">{r.deposit.required ? `${money(r.deposit.amount)} held by ${r.deposit.method.replace('-', ' ')}${r.deposit.holdReference ? ` (${r.deposit.holdReference})` : ''}.` : 'No deposit on this rental. Deductions charge the card on file.'}</p>
          {r.deductions.length > 0 && (
            <ul className="mt-4 flex flex-col text-[14px]">
              {r.deductions.map((x, n) => (
                <li key={x.id} className="flex justify-between gap-4 py-2" style={{ borderTop: n ? '1px solid var(--line)' : undefined }}>
                  <span><span className="font-medium capitalize">{x.category}</span> <span style={{ color: 'var(--fg-2)' }}>{x.note}</span></span>
                  <span className="tabular whitespace-nowrap">{money(x.amount, { cents: true })}</span>
                </li>
              ))}
              <li className="flex justify-between pt-3 font-medium" style={{ borderTop: '1px solid var(--line-strong)' }}><span>Total deductions</span><span className="tabular">{money(deductionTotal, { cents: true })}</span></li>
              {r.deposit.required && <li className="flex justify-between pt-1" style={{ color: 'var(--fg-2)' }}><span>Deposit to return</span><span className="tabular">{money(Math.max(0, r.deposit.amount - deductionTotal), { cents: true })}</span></li>}
            </ul>
          )}
          <form className="mt-5 grid sm:grid-cols-[1fr_1fr] gap-3" onSubmit={(e) => { e.preventDefault(); if (d.amount > 0) { onDeduct({ id: uid('ded'), category: d.category, amount: d.amount, note: d.note, evidence: [], at: nowIso() }); setD({ category: 'damage', amount: 0, note: '' }); } }}>
            <Select value={d.category} onChange={(e) => setD({ ...d, category: e.target.value as Deduction['category'] })} aria-label="Category">{['damage', 'fuel', 'cleaning', 'smoking', 'mileage', 'toll', 'ticket', 'late', 'other'].map((c) => <option key={c} value={c}>{c}</option>)}</Select>
            <MoneyInput value={d.amount} onChange={(n) => setD({ ...d, amount: n })} aria-label="Amount" />
            <Input className="sm:col-span-2" placeholder="What, and which photo proves it" value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} aria-label="Note" />
            <Button type="submit" variant="ghost" className="sm:col-span-2">Add deduction</Button>
          </form>
          {(r.status === 'returned') && <Button className="mt-4" variant="accent" onClick={onReleaseDeposit}>Release deposit and close</Button>}
        </Card>
      </div>
    </div>
  );
}

function CheckInTab({ r, onCheckIn }: { r: Rental; onCheckIn: (snap: NonNullable<Rental['checkin']>, charges: Deduction[]) => void }) {
  const [odo, setOdo] = useState(r.checkin?.odometer ?? r.checkout?.odometer ?? 0);
  const [fuel, setFuel] = useState(r.checkin?.fuelLevel ?? 1);
  const [returnedAt, setReturnedAt] = useState(r.checkin?.at ?? nowIso());
  const [notes, setNotes] = useState(r.checkin?.exteriorNotes ?? '');
  const [smoking, setSmoking] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const out = r.checkout?.odometer ?? 0;
  const dailyRate = r.terms.unit === 'day' ? r.terms.rate : r.terms.unit === 'week' ? r.terms.rate / 7 : r.terms.rate / 30;
  const mi = mileageOverage(out, odo, r.terms.includedMiles, r.terms.overagePerMile);
  const fu = fuelCharge(r.checkout?.fuelLevel ?? 1, fuel, r.fees.fuelRefillPerEighth);
  const late = lateCharge(r.terms.endAt, returnedAt, r.fees, dailyRate);
  const charges: Deduction[] = [];
  if (mi.amount > 0) charges.push({ id: uid('ded'), category: 'mileage', amount: mi.amount, note: `${num(mi.driven)} mi driven, ${num(mi.over)} over allowance at ${money(r.terms.overagePerMile, { cents: true })}`, evidence: [], at: nowIso() });
  if (fu.amount > 0) charges.push({ id: uid('ded'), category: 'fuel', amount: fu.amount + 25, note: `${fu.eighthsShort} eighths short plus $25 service`, evidence: [], at: nowIso() });
  if (late.amount > 0) charges.push({ id: uid('ded'), category: 'late', amount: late.amount, note: late.extraDays ? `${late.hours}h late, billed as ${late.extraDays} extra day(s)` : `${late.hours}h late at ${money(r.fees.lateFeePerHour)}/hr`, evidence: [], at: nowIso() });
  if (smoking) charges.push({ id: uid('ded'), category: 'smoking', amount: r.fees.smokingFee, note: 'Evidence of smoking or vaping', evidence: [], at: nowIso() });
  if (cleaning) charges.push({ id: uid('ded'), category: 'cleaning', amount: r.fees.cleaningFee, note: 'Excessive dirt, stains, or odor', evidence: [], at: nowIso() });
  const done = !!r.checkin;

  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      <Card title={done ? 'Return record' : 'Return inspection'}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Returned at" htmlFor="ra"><Input id="ra" type="datetime-local" value={returnedAt.slice(0, 16)} onChange={(e) => setReturnedAt(new Date(e.target.value).toISOString())} disabled={done} /></Field>
          <Field label="Odometer" htmlFor="ro" hint={`Out at ${num(out)}`}><Input id="ro" type="number" value={odo || ''} onChange={(e) => setOdo(Number(e.target.value))} disabled={done} className="tabular" /></Field>
        </div>
        <p className="text-[13px] font-medium mt-4 mb-2" style={{ color: 'var(--fg-2)' }}>Fuel</p>
        <div role="radiogroup" className="flex gap-1">{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <button key={n} role="radio" aria-checked={Math.round(fuel * 8) === n} aria-label={`${n}/8`} disabled={done} onClick={() => setFuel(n / 8)} className="h-10 flex-1 rounded-md" style={{ background: n <= Math.round(fuel * 8) ? 'var(--accent)' : 'var(--surface-2)' }} />)}</div>
        <div className="mt-4 divide-y" style={{ borderColor: 'var(--line)' }}>
          <Toggle id="smk" label={`Smoking or vaping evidence (${money(r.fees.smokingFee)})`} checked={smoking} onChange={setSmoking} />
          <Toggle id="cln" label={`Needs deep cleaning (${money(r.fees.cleaningFee)})`} checked={cleaning} onChange={setCleaning} />
        </div>
        <Field label="Notes and new damage" htmlFor="rn"><Textarea id="rn" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={done} placeholder="Curb rash front right wheel, photo 4. Rear diffuser scuffed, photo 9." /></Field>
        <p className="mt-3 text-[13px]" style={{ color: 'var(--fg-3)' }}>Photograph every panel again before the renter leaves. Damage not in the check-out photos is billable; damage without a check-in photo is not.</p>
      </Card>
      <Card title="Charges computed">
        <ul className="flex flex-col text-[14px]">
          <li className="flex justify-between py-2"><span>Miles driven</span><span className="tabular">{num(mi.driven)} of {num(r.terms.includedMiles)}</span></li>
          {charges.map((c, n) => <li key={n} className="flex justify-between py-2" style={{ borderTop: '1px solid var(--line)' }}><span><span className="capitalize font-medium">{c.category}</span> <span style={{ color: 'var(--fg-2)' }}>{c.note}</span></span><span className="tabular">{money(c.amount, { cents: true })}</span></li>)}
          {!charges.length && <li className="py-2" style={{ color: 'var(--fg-3)' }}>Nothing to charge. Clean return.</li>}
          <li className="flex justify-between pt-3 font-medium" style={{ borderTop: '1px solid var(--line-strong)' }}><span>Total</span><span className="tabular">{money(charges.reduce((s, c) => s + c.amount, 0), { cents: true })}</span></li>
        </ul>
        {!done && <Button className="mt-6" variant="accent" onClick={() => onCheckIn({ at: returnedAt, odometer: odo, fuelLevel: fuel, exteriorNotes: notes, damages: [], photos: [] }, charges)} disabled={odo < out}>Complete check-in</Button>}
        {done && <p className="mt-4 text-[13px]" style={{ color: 'var(--fg-3)' }}>Checked in {formatDistanceToNow(new Date(r.checkin!.at))} ago.</p>}
      </Card>
    </div>
  );
}
