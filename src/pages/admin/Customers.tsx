import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { format } from 'date-fns';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Page, PageHeader } from '@/components/admin/AdminLayout';
import { Button, Empty, Field, Pill, Textarea, Toggle } from '@/components/ui';
import { useCustomers, useFleet, useRentals } from '@/store';
import { STATUS_LABEL, STATUS_TONE } from './Rentals';
import { formatAddress } from '@/lib/address';
import { fullName, initials, money, ageOn } from '@/lib/util';

export function Customers() {
  const customers = useCustomers((s) => s.customers);
  const [q, setQ] = useState('');
  const list = useMemo(() => customers.filter((c) => `${fullName(c)} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [customers, q]);
  return (
    <Page wide>
      <title>Customers. Nova Wheels</title>
      <PageHeader title="Customers" subtitle={`${customers.length} on file`} />
      <div className="relative max-w-[420px] mb-8">
        <MagnifyingGlass aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 size-4" style={{ color: 'var(--fg-3)' }} />
        <input className="field-box pl-11" placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" />
      </div>
      {list.length === 0 ? <Empty title="No customers match." body="Customers are created automatically when you handle a rental." /> : (
        <ul className="rounded-[var(--radius-lg)] overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
          {list.map((c, i) => (
            <li key={c.id} style={{ borderTop: i ? '1px solid var(--line)' : undefined }}>
              <Link to={`/admin/customers/${c.id}`} className="grid grid-cols-[44px_1fr_auto] md:grid-cols-[44px_1.4fr_1fr_1fr_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)] text-[14px]">
                <span className="size-11 rounded-full inline-flex items-center justify-center text-[13px] font-medium" style={{ background: 'var(--surface-2)' }}>{initials(c.firstName, c.lastName)}</span>
                <span><span className="font-medium">{fullName(c)}</span><span className="block text-[13px]" style={{ color: 'var(--fg-3)' }}>{c.email}</span></span>
                <span className="hidden md:block">{c.phone}</span>
                <span className="hidden md:block tabular" style={{ color: 'var(--fg-2)' }}>{c.rentalCount} rental{c.rentalCount === 1 ? '' : 's'} · {money(c.lifetimeValue)}</span>
                <span className="flex gap-1">{c.flags.map((f) => <Pill key={f} tone={f === 'vip' ? 'accent' : f === 'watch' ? 'warn' : 'danger'}>{f === 'do-not-rent' ? 'Do not rent' : f.toUpperCase()}</Pill>)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

export function CustomerDetail() {
  const { id } = useParams();
  const customers = useCustomers();
  const rentals = useRentals((s) => s.rentals);
  const vehicles = useFleet((s) => s.vehicles);
  const c = customers.byId(id ?? '');
  const [notes, setNotes] = useState(c?.notes ?? '');
  if (!c) return <Page><p>Customer not found.</p></Page>;
  const history = rentals.filter((r) => r.customerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const toggleFlag = (f: 'vip' | 'watch' | 'do-not-rent', on: boolean) => customers.upsert({ ...c, flags: on ? [...new Set([...c.flags, f])] : c.flags.filter((x) => x !== f) });
  const licenseExpired = c.license?.expires && new Date(c.license.expires) < new Date();
  return (
    <Page wide>
      <title>{`${fullName(c)}. Nova Wheels`}</title>
      <PageHeader title={fullName(c)} subtitle={`${c.rentalCount} rental${c.rentalCount === 1 ? '' : 's'}, ${money(c.lifetimeValue)} lifetime`} actions={<>{c.flags.map((f) => <Pill key={f} tone={f === 'vip' ? 'accent' : f === 'watch' ? 'warn' : 'danger'}>{f === 'do-not-rent' ? 'Do not rent' : f.toUpperCase()}</Pill>)}<Link to="/admin/customers" className="btn btn-quiet btn-sm">All customers</Link></>} />
      <div className="grid md:grid-cols-[1fr_340px] gap-8 items-start">
        <div className="flex flex-col gap-6">
          <section className="rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="text-[15px] font-medium mb-4">File</h2>
            <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-[14px]">
              {([
                ['Phone', c.phone], ['Email', c.email], ['Date of birth', c.dateOfBirth ? `${format(new Date(c.dateOfBirth + 'T12:00:00'), 'MMM d, yyyy')} (${ageOn(c.dateOfBirth)})` : 'Not on file'], ['Address', formatAddress(c.address) || 'Not on file'],
                ['License', c.license?.number ? `${c.license.state} ${c.license.number}, expires ${c.license.expires}${licenseExpired ? ' (expired)' : ''}${c.license.verifiedAt ? ', verified ' + format(new Date(c.license.verifiedAt), 'MMM d, yyyy') : ''}` : 'Not on file'],
                ['Insurance', c.insurance?.mode === 'company-cdw' ? 'Uses our damage waiver' : c.insurance?.carrier ? `${c.insurance.carrier} ${c.insurance.policyNumber ?? ''} ${c.insurance.liabilityLimits ?? ''}${c.insurance.expires ? `, expires ${c.insurance.expires}` : ''}` : 'Not on file'],
                ['Customer since', format(new Date(c.createdAt), 'MMM d, yyyy')],
              ] as [string, string][]).map(([k, v]) => (<div key={k} className="contents"><dt style={{ color: 'var(--fg-3)' }}>{k}</dt><dd style={{ color: k === 'License' && licenseExpired ? 'var(--color-danger)' : undefined }}>{v}</dd></div>))}
            </dl>
          </section>
          <section className="rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="text-[15px] font-medium mb-4">Rentals</h2>
            {history.length === 0 ? <p className="text-[14px]" style={{ color: 'var(--fg-3)' }}>None yet.</p> : (
              <ul className="flex flex-col text-[14px]">
                {history.map((r, i) => { const v = vehicles.find((x) => x.id === r.vehicleId); return (
                  <li key={r.id} className="flex items-center justify-between gap-4 py-3" style={{ borderTop: i ? '1px solid var(--line)' : undefined }}>
                    <span><Link to={`/admin/rentals/${r.id}`} className="font-medium hover:underline underline-offset-4 tabular">{r.number}</Link> <span style={{ color: 'var(--fg-2)' }}>{v ? `${v.year} ${v.make} ${v.model}` : ''}</span><span className="block text-[13px]" style={{ color: 'var(--fg-3)' }}>{format(new Date(r.terms.startAt), 'MMM d')} to {format(new Date(r.terms.endAt), 'MMM d, yyyy')}{r.deductions.length ? ` · ${r.deductions.length} deduction${r.deductions.length === 1 ? '' : 's'}` : ''}</span></span>
                    <Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Pill>
                  </li>
                ); })}
              </ul>
            )}
          </section>
        </div>
        <div className="flex flex-col gap-6">
          <section className="rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="text-[15px] font-medium mb-2">Flags</h2>
            <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
              <Toggle id="vip" label="VIP" description="Priority on availability, delivery included." checked={c.flags.includes('vip')} onChange={(v) => toggleFlag('vip', v)} />
              <Toggle id="watch" label="Watch" description="Rent with extra verification." checked={c.flags.includes('watch')} onChange={(v) => toggleFlag('watch', v)} />
              <Toggle id="dnr" label="Do not rent" description="Blocks the rental wizard." checked={c.flags.includes('do-not-rent')} onChange={(v) => toggleFlag('do-not-rent', v)} />
            </div>
          </section>
          <section className="rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            <Field label="Notes" htmlFor="notes"><Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preferences, incidents, how they pay." /></Field>
            <Button className="mt-3" size="sm" variant="ghost" onClick={() => customers.upsert({ ...c, notes })}>Save notes</Button>
          </section>
        </div>
      </div>
    </Page>
  );
}
