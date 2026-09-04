import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Page, PageHeader } from '@/components/admin/AdminLayout';
import { Pill, Empty } from '@/components/ui';
import { VehicleImage } from '@/components/site/VehicleImage';
import { useFleet, useRentals } from '@/store';
import type { VehicleStatus } from '@/lib/types';
import { money, num, cx } from '@/lib/util';

export const VSTATUS: Record<VehicleStatus, { label: string; tone: 'ok' | 'warn' | 'neutral' | 'accent' | 'danger' }> = {
  available: { label: 'Available', tone: 'ok' }, rented: { label: 'Out', tone: 'accent' }, reserved: { label: 'Reserved', tone: 'warn' }, maintenance: { label: 'In service', tone: 'warn' }, transit: { label: 'In transit', tone: 'neutral' }, retired: { label: 'Retired', tone: 'neutral' },
};

export function Inventory() {
  const vehicles = useFleet((s) => s.vehicles);
  const rentals = useRentals((s) => s.rentals);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<VehicleStatus | 'all'>('all');
  const list = useMemo(() => vehicles.filter((v) => (status === 'all' || v.status === status) && `${v.year} ${v.make} ${v.model} ${v.plate ?? ''} ${v.vin} ${v.color}`.toLowerCase().includes(q.toLowerCase())), [vehicles, q, status]);
  const counts = useMemo(() => vehicles.reduce((m, v) => ({ ...m, [v.status]: (m[v.status] ?? 0) + 1 }), {} as Record<string, number>), [vehicles]);

  return (
    <Page wide>
      <title>Inventory. Nova Wheels</title>
      <PageHeader title="Inventory" subtitle={`${vehicles.length} vehicles, ${counts.available ?? 0} available`} actions={<Link to="/admin/inventory/new" className="btn btn-accent">Add a vehicle</Link>} />
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlass aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 size-4" style={{ color: 'var(--fg-3)' }} />
          <input className="field-box pl-11" placeholder="Search make, model, plate, VIN" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search inventory" />
        </div>
        <div role="radiogroup" aria-label="Status" className="flex flex-wrap gap-2">
          {(['all', 'available', 'rented', 'maintenance', 'retired'] as const).map((s) => (
            <button key={s} role="radio" aria-checked={status === s} onClick={() => setStatus(s)} className={cx('h-9 px-4 rounded-full text-[13px] font-medium transition-colors', status === s ? 'bg-[var(--fg)] text-[var(--bg)]' : 'bg-[var(--surface-2)] hover:bg-[var(--line)]')}>{s === 'all' ? 'All' : VSTATUS[s].label}{s !== 'all' && counts[s] ? ` ${counts[s]}` : ''}</button>
          ))}
        </div>
      </div>
      {list.length === 0 ? <Empty title="No vehicles match." body="Add one by VIN and the decoder fills in the rest." action={<Link to="/admin/inventory/new" className="btn btn-primary btn-sm">Add a vehicle</Link>} /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((v) => {
            const active = rentals.find((r) => r.vehicleId === v.id && ['active', 'extended', 'overdue', 'non-return'].includes(r.status));
            return (
              <Link key={v.id} to={`/admin/inventory/${v.id}`} className="group rounded-[var(--radius-lg)] overflow-hidden transition-transform duration-300 hover:-translate-y-0.5" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
                <div className="aspect-[16/9] overflow-hidden"><VehicleImage vehicle={v} plateClass="plate-light" className="w-full h-full transition-transform duration-[1200ms] group-hover:scale-[1.03]" /></div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[16px] font-medium">{v.year} {v.make} {v.model}</p><p className="text-[13px]" style={{ color: 'var(--fg-3)' }}>{v.color}{v.plate ? ` · ${v.plate}` : ''} · {num(v.odometer)} mi</p></div>
                    <Pill tone={VSTATUS[v.status].tone}>{VSTATUS[v.status].label}</Pill>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[13px] tabular">
                    <span>{money(v.rates.daily)}/day · {money(v.rates.weekly)}/wk</span>
                    {active && <span style={{ color: 'var(--fg-3)' }}>{active.number}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Page>
  );
}
