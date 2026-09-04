import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { Page, PageHeader } from '@/components/admin/AdminLayout';
import { Button, Empty, Pill } from '@/components/ui';
import { useFleet, useReservations, useSettings } from '@/store';
import { useWizard } from '@/store/wizard';
import { formatPhone } from '@/lib/util';

export function Reservations() {
  const { reservations, setStatus } = useReservations();
  const vehicles = useFleet((s) => s.vehicles);
  const settings = useSettings((s) => s.settings);
  const nav = useNavigate();
  const convert = (id: string) => {
    const r = reservations.find((x) => x.id === id);
    if (!r) return;
    const [first, ...rest] = r.name.split(' ');
    const v = vehicles.find((x) => x.id === r.vehicleId);
    const days = Math.max(1, Math.round((new Date(r.endAt).getTime() - new Date(r.startAt).getTime()) / 86400000));
    useWizard.getState().start(settings.defaults.fees, settings.defaults.rules, {
      vehicleId: v?.id, firstName: first, lastName: rest.join(' '), email: r.email, phone: formatPhone(r.phone), startAt: r.startAt,
      unit: days >= 28 ? 'month' : days >= 7 ? 'week' : 'day', quantity: days >= 28 ? Math.round(days / 30) : days >= 7 ? Math.round(days / 7) : days,
      includedMilesPerDay: v?.includedMilesPerDay ?? settings.defaults.includedMilesPerDay, overagePerMile: v?.overagePerMile ?? settings.defaults.overagePerMile, depositAmount: v?.depositDefault ?? settings.defaults.depositAmount, odometerOut: v?.odometer,
    });
    setStatus(id, 'converted');
    nav(v ? '/admin/rental/new/condition' : '/admin/rental/new/vehicle');
  };
  return (
    <Page>
      <title>Requests. Nova Wheels</title>
      <PageHeader title="Requests" subtitle="Reservation requests from the website. Convert one and the rental wizard opens prefilled." />
      {reservations.length === 0 ? <Empty title="No requests yet." body="Requests submitted on the public Reserve page land here." /> : (
        <ul className="rounded-[var(--radius-lg)] overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
          {reservations.map((r, i) => { const v = vehicles.find((x) => x.id === r.vehicleId); return (
            <li key={r.id} className="grid md:grid-cols-[1fr_auto] gap-4 px-5 py-4" style={{ borderTop: i ? '1px solid var(--line)' : undefined }}>
              <div className="text-[14px]">
                <p className="font-medium">{r.name} <span style={{ color: 'var(--fg-3)' }}>· {r.phone} · {r.email}</span></p>
                <p style={{ color: 'var(--fg-2)' }}>{v ? `${v.year} ${v.make} ${v.model}` : 'Any car'}, {format(new Date(r.startAt), 'MMM d')} to {format(new Date(r.endAt), 'MMM d')}</p>
                {r.message && <p className="mt-1" style={{ color: 'var(--fg-3)' }}>{r.message}</p>}
                <p className="mt-1 text-[12px]" style={{ color: 'var(--fg-3)' }}>Received {format(new Date(r.createdAt), 'MMM d, h:mm a')}</p>
              </div>
              <div className="flex items-center gap-2 self-start">
                <Pill tone={r.status === 'new' ? 'accent' : r.status === 'converted' ? 'ok' : 'neutral'}>{r.status}</Pill>
                {r.status !== 'converted' && <Button size="sm" variant="accent" onClick={() => convert(r.id)}>Convert to rental</Button>}
                {r.status === 'new' && <Button size="sm" variant="quiet" onClick={() => setStatus(r.id, 'contacted')}>Mark contacted</Button>}
                {r.status !== 'declined' && r.status !== 'converted' && <Button size="sm" variant="quiet" onClick={() => setStatus(r.id, 'declined')}>Decline</Button>}
              </div>
            </li>
          ); })}
        </ul>
      )}
    </Page>
  );
}
