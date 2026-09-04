import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { format, isThisMonth } from 'date-fns';
import { Page, PageHeader } from '@/components/admin/AdminLayout';
import { Pill, Empty } from '@/components/ui';
import { useCustomers, useFleet, useRentals } from '@/store';
import { fullName, money, cx } from '@/lib/util';

export function Payments() {
  const rentals = useRentals((s) => s.rentals);
  const customers = useCustomers((s) => s.customers);
  const vehicles = useFleet((s) => s.vehicles);
  const [view, setView] = useState<'due' | 'paid' | 'deductions'>('due');
  const now = new Date();
  const rows = useMemo(() => rentals.filter((r) => !['cancelled', 'draft'].includes(r.status)).flatMap((r) => r.installments.map((i) => ({ r, i }))), [rentals]);
  const due = rows.filter(({ i }) => i.status !== 'paid' && i.status !== 'waived').sort((a, b) => a.i.dueAt.localeCompare(b.i.dueAt));
  const paid = rows.filter(({ i }) => i.status === 'paid' || i.paidAmount > 0).sort((a, b) => (b.i.paidAt ?? '').localeCompare(a.i.paidAt ?? ''));
  const deductions = rentals.flatMap((r) => r.deductions.map((d) => ({ r, d }))).sort((a, b) => b.d.at.localeCompare(a.d.at));
  const collectedMonth = paid.filter(({ i }) => i.paidAt && isThisMonth(new Date(i.paidAt))).reduce((s, { i }) => s + i.paidAmount, 0);
  const outstanding = due.reduce((s, { i }) => s + (i.amount - i.paidAmount), 0);
  const overdueAmt = due.filter(({ i }) => new Date(i.dueAt) < now).reduce((s, { i }) => s + (i.amount - i.paidAmount), 0);

  return (
    <Page wide>
      <title>Payments. Nova Wheels</title>
      <PageHeader title="Payments" subtitle="Every installment, every deduction, across every rental." />
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[['Collected this month', money(collectedMonth, { cents: true }), 'ok'], ['Outstanding', money(outstanding, { cents: true }), 'neutral'], ['Overdue', money(overdueAmt, { cents: true }), overdueAmt ? 'danger' : 'neutral']].map(([k, v, tone]) => (
          <div key={k} className="rounded-[var(--radius-lg)] p-5" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            <p className="text-[13px]" style={{ color: 'var(--fg-3)' }}>{k}</p>
            <p className="font-display text-[34px] leading-none mt-2 tabular" style={{ color: tone === 'danger' ? 'var(--color-danger)' : tone === 'ok' ? 'var(--color-ok)' : undefined }}>{v}</p>
          </div>
        ))}
      </div>
      <div role="tablist" className="flex gap-1 mb-6">
        {([['due', `Due (${due.length})`], ['paid', 'Received'], ['deductions', `Deductions (${deductions.length})`]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)} className={cx('h-9 px-4 rounded-full text-[13px] font-medium', view === k ? 'bg-[var(--fg)] text-[var(--bg)]' : 'hover:bg-[var(--surface-2)]')}>{l}</button>
        ))}
      </div>
      <div className="rounded-[var(--radius-lg)] overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
        {view === 'due' && (due.length === 0 ? <Empty title="Nothing outstanding." /> : due.map(({ r, i }, n) => {
          const late = new Date(i.dueAt) < now;
          const c = customers.find((x) => x.id === r.customerId);
          return (
            <Link key={i.id} to={`/admin/rentals/${r.id}`} className="grid grid-cols-[1fr_auto] md:grid-cols-[110px_1fr_1fr_auto_auto] items-center gap-4 px-5 py-3.5 text-[14px] transition-colors hover:bg-[var(--surface-2)]" style={{ borderTop: n ? '1px solid var(--line)' : undefined }}>
              <span className="tabular" style={{ color: late ? 'var(--color-danger)' : 'var(--fg-3)' }}>{format(new Date(i.dueAt), 'MMM d')}</span>
              <span className="hidden md:block">{c ? fullName(c) : ''}</span>
              <span className="hidden md:block" style={{ color: 'var(--fg-2)' }}>{i.label} · {r.number}</span>
              <span className="tabular font-medium">{money(i.amount - i.paidAmount, { cents: true })}</span>
              <span className="hidden md:block"><Pill tone={late ? 'danger' : i.status === 'due' ? 'warn' : 'neutral'}>{late ? 'Overdue' : i.status === 'due' ? 'Due' : 'Scheduled'}</Pill></span>
            </Link>
          );
        }))}
        {view === 'paid' && (paid.length === 0 ? <Empty title="No payments yet." /> : paid.map(({ r, i }, n) => {
          const c = customers.find((x) => x.id === r.customerId);
          const v = vehicles.find((x) => x.id === r.vehicleId);
          return (
            <Link key={i.id} to={`/admin/rentals/${r.id}`} className="grid grid-cols-[1fr_auto] md:grid-cols-[110px_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3.5 text-[14px] transition-colors hover:bg-[var(--surface-2)]" style={{ borderTop: n ? '1px solid var(--line)' : undefined }}>
              <span className="tabular" style={{ color: 'var(--fg-3)' }}>{i.paidAt ? format(new Date(i.paidAt), 'MMM d') : ''}</span>
              <span className="hidden md:block">{c ? fullName(c) : ''}</span>
              <span className="hidden md:block" style={{ color: 'var(--fg-2)' }}>{v ? `${v.make} ${v.model}` : ''} · {r.number}</span>
              <span className="hidden md:block" style={{ color: 'var(--fg-3)' }}>{i.method?.replace(/-/g, ' ')}{i.reference ? ` · ${i.reference}` : ''}</span>
              <span className="tabular font-medium" style={{ color: 'var(--color-ok)' }}>{money(i.paidAmount, { cents: true })}</span>
            </Link>
          );
        }))}
        {view === 'deductions' && (deductions.length === 0 ? <Empty title="No deductions recorded." /> : deductions.map(({ r, d }, n) => {
          const c = customers.find((x) => x.id === r.customerId);
          return (
            <Link key={d.id} to={`/admin/rentals/${r.id}`} className="grid grid-cols-[1fr_auto] md:grid-cols-[110px_1fr_2fr_auto] items-center gap-4 px-5 py-3.5 text-[14px] transition-colors hover:bg-[var(--surface-2)]" style={{ borderTop: n ? '1px solid var(--line)' : undefined }}>
              <span className="tabular" style={{ color: 'var(--fg-3)' }}>{format(new Date(d.at), 'MMM d')}</span>
              <span className="hidden md:block">{c ? fullName(c) : ''} · {r.number}</span>
              <span className="hidden md:block" style={{ color: 'var(--fg-2)' }}><span className="capitalize font-medium" style={{ color: 'var(--fg)' }}>{d.category}</span> {d.note}</span>
              <span className="tabular font-medium">{money(d.amount, { cents: true })}</span>
            </Link>
          );
        }))}
      </div>
    </Page>
  );
}
