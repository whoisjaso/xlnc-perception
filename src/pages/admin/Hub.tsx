import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Car, FileText, Gear, Receipt, Tray, UsersThree, ClipboardText } from '@phosphor-icons/react';
import { differenceInHours, format, isToday } from 'date-fns';
import { useCustomers, useFleet, useRentals, useReservations, useSettings } from '@/store';
import { Page } from '@/components/admin/AdminLayout';
import { Pill } from '@/components/ui';
import { money, fullName } from '@/lib/util';

export function Hub() {
  const vehicles = useFleet((s) => s.vehicles);
  const rentals = useRentals((s) => s.rentals);
  const customers = useCustomers((s) => s.customers);
  const reservations = useReservations((s) => s.reservations);
  const settings = useSettings((s) => s.settings);
  const reduce = useReducedMotion();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const active = rentals.filter((r) => ['active', 'extended', 'overdue', 'non-return'].includes(r.status));
  const awaiting = rentals.filter((r) => r.status === 'awaiting-signature' || r.status === 'signed');
  const dueToday = active.filter((r) => isToday(new Date(r.terms.endAt)));
  const overdue = active.filter((r) => new Date(r.terms.endAt) < now && r.status !== 'returned');
  const paymentsDue = rentals.flatMap((r) => r.installments.filter((i) => (i.status === 'due' || i.status === 'overdue' || (i.status === 'scheduled' && new Date(i.dueAt) <= now)) && r.status !== 'closed' && r.status !== 'cancelled').map((i) => ({ r, i })));
  const available = vehicles.filter((v) => v.status === 'available').length;
  const newRes = reservations.filter((r) => r.status === 'new').length;
  const monthRevenue = rentals.flatMap((r) => r.installments).filter((i) => i.paidAt && new Date(i.paidAt).getMonth() === now.getMonth() && new Date(i.paidAt).getFullYear() === now.getFullYear()).reduce((s, i) => s + i.paidAmount, 0);

  const tiles = [
    { to: '/admin/inventory', icon: Car, label: 'Inventory', meta: `${available} of ${vehicles.length} available` },
    { to: '/admin/rentals', icon: ClipboardText, label: 'Rentals', meta: `${active.length} out, ${awaiting.length} awaiting signature` },
    { to: '/admin/customers', icon: UsersThree, label: 'Customers', meta: `${customers.length} on file` },
    { to: '/admin/payments', icon: Receipt, label: 'Payments', meta: paymentsDue.length ? `${paymentsDue.length} due` : `${money(monthRevenue)} collected this month` },
    { to: '/admin/contracts', icon: FileText, label: 'Contract templates', meta: 'Clauses, plain-language lines' },
    { to: '/admin/reservations', icon: Tray, label: 'Requests', meta: newRes ? `${newRes} new from the site` : 'Nothing new' },
    { to: '/admin/settings', icon: Gear, label: 'Settings', meta: settings.dba },
  ];

  return (
    <Page wide>
      <title>Hub. Nova Wheels</title>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[15px]" style={{ color: 'var(--fg-3)' }}>{format(now, 'EEEE, MMMM d')}</p>
          <h1 className="font-display text-[clamp(34px,5vw,60px)] leading-[1.02] mt-1">{greeting}.</h1>
        </div>
        <p className="text-[15px] tabular" style={{ color: 'var(--fg-2)' }}>{money(monthRevenue)} collected in {format(now, 'MMMM')}</p>
      </div>

      <div className="mt-10 grid md:grid-cols-12 gap-4">
        <motion.div className="md:col-span-7 md:row-span-2" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
          <Link to="/admin/rental/new/vehicle" className="group flex flex-col justify-between h-full min-h-[280px] rounded-[var(--radius-lg)] p-8 md:p-10 transition-transform duration-500 hover:-translate-y-0.5" style={{ background: '#0f1012', color: '#f4f2ee', boxShadow: 'var(--shadow-2)' }}>
            <p className="label-caps" style={{ color: '#d6b25f' }}>Start here</p>
            <div>
              <p className="font-display text-[clamp(36px,4.5vw,60px)] leading-[1.02]">Handle a rental</p>
              <p className="mt-3 text-[16px] max-w-[40ch]" style={{ color: 'rgb(244 242 238 / 0.7)' }}>Car, renter, terms, money, contract, signature. One screen at a time, about six minutes.</p>
            </div>
            <span className="inline-flex items-center gap-2 label-caps transition-all group-hover:gap-3" style={{ color: '#d6b25f' }}>Begin <ArrowRight aria-hidden className="size-4" /></span>
          </Link>
        </motion.div>

        <div className="md:col-span-5 rounded-[var(--radius-lg)] p-6 min-w-0 overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
          <p className="text-[15px] font-medium">Needs attention</p>
          <ul className="mt-4 flex flex-col gap-3 text-[14px]">
            {overdue.map((r) => <Row key={r.id} to={`/admin/rentals/${r.id}`} tone="danger" label={`${vehicleName(vehicles, r.vehicleId)} is ${differenceInHours(now, new Date(r.terms.endAt))}h past return`} meta={customerName(customers, r.customerId)} />)}
            {dueToday.filter((r) => !overdue.includes(r)).map((r) => <Row key={r.id} to={`/admin/rentals/${r.id}`} tone="warn" label={`${vehicleName(vehicles, r.vehicleId)} due back ${format(new Date(r.terms.endAt), 'h:mm a')}`} meta={customerName(customers, r.customerId)} />)}
            {paymentsDue.slice(0, 4).map(({ r, i }) => <Row key={i.id} to={`/admin/rentals/${r.id}`} tone="warn" label={`${money(i.amount)} due ${format(new Date(i.dueAt), 'MMM d')}`} meta={`${customerName(customers, r.customerId)}, ${r.number}`} />)}
            {awaiting.map((r) => <Row key={r.id} to={`/admin/rentals/${r.id}`} tone="accent" label={`${r.number} awaiting ${r.status === 'signed' ? 'check-out' : 'signature'}`} meta={customerName(customers, r.customerId)} />)}
            {!overdue.length && !dueToday.length && !paymentsDue.length && !awaiting.length && <li style={{ color: 'var(--fg-3)' }}>Nothing overdue. Nothing due today.</li>}
          </ul>
        </div>

        <div className="md:col-span-5 rounded-[var(--radius-lg)] p-6 min-w-0 overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
          <p className="text-[15px] font-medium">Out right now</p>
          <ul className="mt-4 flex flex-col gap-3 text-[14px]">
            {active.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 min-w-0">
                <Link to={`/admin/rentals/${r.id}`} className="truncate min-w-0 hover:underline underline-offset-4">{vehicleName(vehicles, r.vehicleId)}</Link>
                <span className="tabular whitespace-nowrap" style={{ color: 'var(--fg-3)' }}>back {format(new Date(r.terms.endAt), 'MMM d, h a')}</span>
              </li>
            ))}
            {!active.length && <li style={{ color: 'var(--fg-3)' }}>Every car is on the lot.</li>}
          </ul>
        </div>

        {tiles.map((t, i) => (
          <motion.div key={t.to} className={i % 3 === 0 ? 'md:col-span-4' : 'md:col-span-4'} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}>
            <Link to={t.to} className="group flex items-center gap-4 rounded-[var(--radius-lg)] p-5 transition-all duration-300 hover:-translate-y-0.5" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
              <span className="inline-flex size-11 items-center justify-center rounded-full shrink-0" style={{ background: 'var(--surface-2)' }}><t.icon aria-hidden className="size-5" /></span>
              <span className="flex flex-col min-w-0">
                <span className="text-[16px] font-medium">{t.label}</span>
                <span className="text-[13px] truncate" style={{ color: 'var(--fg-3)' }}>{t.meta}</span>
              </span>
              <ArrowRight aria-hidden className="ml-auto size-4 opacity-0 -translate-x-1 transition-all group-hover:opacity-60 group-hover:translate-x-0" />
            </Link>
          </motion.div>
        ))}
      </div>
    </Page>
  );
}

function Row({ to, tone, label, meta }: { to: string; tone: 'danger' | 'warn' | 'accent'; label: string; meta: string }) {
  return (
    <li className="flex items-center justify-between gap-4 min-w-0">
      <Link to={to} className="flex items-center gap-3 min-w-0 shrink hover:underline underline-offset-4">
        <Pill tone={tone}>{tone === 'danger' ? 'Overdue' : tone === 'warn' ? 'Today' : 'Pending'}</Pill>
        <span className="truncate">{label}</span>
      </Link>
      <span className="truncate text-right min-w-0 shrink hidden sm:block" style={{ color: 'var(--fg-3)' }}>{meta}</span>
    </li>
  );
}

const vehicleName = (vs: { id: string; make: string; model: string }[], id: string) => { const v = vs.find((x) => x.id === id); return v ? `${v.make} ${v.model}` : 'Vehicle'; };
const customerName = (cs: { id: string; firstName: string; middleName?: string; lastName: string }[], id: string) => { const c = cs.find((x) => x.id === id); return c ? fullName(c) : 'Customer'; };
