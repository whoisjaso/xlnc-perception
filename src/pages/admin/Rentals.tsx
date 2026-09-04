import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { format } from 'date-fns';
import { Page, PageHeader } from '@/components/admin/AdminLayout';
import { Pill, Empty } from '@/components/ui';
import { useCustomers, useFleet, useRentals } from '@/store';
import type { RentalStatus } from '@/lib/types';
import { fullName, money, cx } from '@/lib/util';

export const STATUS_TONE: Record<RentalStatus, 'neutral' | 'ok' | 'warn' | 'danger' | 'accent'> = {
  draft: 'neutral', 'awaiting-signature': 'accent', signed: 'accent', active: 'ok', extended: 'ok', overdue: 'danger', 'non-return': 'danger', returned: 'warn', closed: 'neutral', cancelled: 'neutral',
};
export const STATUS_LABEL: Record<RentalStatus, string> = {
  draft: 'Draft', 'awaiting-signature': 'Awaiting signature', signed: 'Signed', active: 'Out', extended: 'Extended', overdue: 'Overdue', 'non-return': 'Non-return', returned: 'Returned', closed: 'Closed', cancelled: 'Cancelled',
};

const FILTERS: { key: string; label: string; match: (s: RentalStatus) => boolean }[] = [
  { key: 'open', label: 'Open', match: (s) => !['closed', 'cancelled'].includes(s) },
  { key: 'out', label: 'Out', match: (s) => ['active', 'extended', 'overdue', 'non-return'].includes(s) },
  { key: 'pending', label: 'Pending', match: (s) => ['draft', 'awaiting-signature', 'signed'].includes(s) },
  { key: 'done', label: 'Closed', match: (s) => ['returned', 'closed', 'cancelled'].includes(s) },
  { key: 'all', label: 'All', match: () => true },
];

export function Rentals() {
  const rentals = useRentals((s) => s.rentals);
  const vehicles = useFleet((s) => s.vehicles);
  const customers = useCustomers((s) => s.customers);
  const [f, setF] = useState('open');
  const list = useMemo(() => rentals.filter((r) => FILTERS.find((x) => x.key === f)!.match(r.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [rentals, f]);

  return (
    <Page wide>
      <title>Rentals. Nova Wheels</title>
      <PageHeader title="Rentals" subtitle={`${rentals.length} on record`} actions={<Link to="/admin/rental/new/vehicle" className="btn btn-accent">Handle a rental</Link>} />
      <div role="radiogroup" aria-label="Filter" className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((x) => (
          <button key={x.key} role="radio" aria-checked={f === x.key} onClick={() => setF(x.key)} className={cx('h-9 px-4 rounded-full text-[13px] font-medium transition-colors', f === x.key ? 'bg-[var(--fg)] text-[var(--bg)]' : 'bg-[var(--surface-2)] hover:bg-[var(--line)]')}>{x.label}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty title="Nothing here." body="Rentals matching this filter will appear as they are created." />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)]" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
          <table className="w-full min-w-[820px] text-left text-[14px]">
            <thead>
              <tr className="text-[12px] uppercase tracking-[0.1em]" style={{ color: 'var(--fg-3)' }}>
                {['Rental', 'Vehicle', 'Renter', 'Out', 'Back', 'Total', 'Status'].map((h) => <th key={h} className="font-medium px-5 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const v = vehicles.find((x) => x.id === r.vehicleId);
                const c = customers.find((x) => x.id === r.customerId);
                const total = r.installments.reduce((s, i) => s + i.amount, 0);
                return (
                  <tr key={r.id} className="transition-colors hover:bg-[var(--surface-2)]" style={{ borderTop: '1px solid var(--line)' }}>
                    <td className="px-5 py-3.5"><Link to={`/admin/rentals/${r.id}`} className="font-medium hover:underline underline-offset-4 tabular">{r.number}</Link></td>
                    <td className="px-5 py-3.5">{v ? `${v.year} ${v.make} ${v.model}` : 'Removed'}</td>
                    <td className="px-5 py-3.5">{c ? fullName(c) : 'Unknown'}</td>
                    <td className="px-5 py-3.5 tabular whitespace-nowrap">{format(new Date(r.terms.startAt), 'MMM d, h a')}</td>
                    <td className="px-5 py-3.5 tabular whitespace-nowrap">{format(new Date(r.terms.endAt), 'MMM d, h a')}</td>
                    <td className="px-5 py-3.5 tabular">{money(total)}</td>
                    <td className="px-5 py-3.5"><Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Pill></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
