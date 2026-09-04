import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CompanySettings, ContractTemplate, Customer, Rental, RentalEvent, Reservation, UserProfile, Vehicle } from '@/lib/types';
import { DEFAULT_SETTINGS, SEED_CUSTOMERS, SEED_RENTALS, SEED_VEHICLES } from '@/data/seed';
import { DEFAULT_TEMPLATE } from '@/data/clauses';
import { mirror, mirrorDelete, pull, supabase, supabaseEnabled } from '@/lib/supabase';
import { nowIso, uid } from '@/lib/util';
import { setSoundEnabled } from '@/lib/sound';

/* ---------------- auth ---------------- */
interface AuthState {
  user: UserProfile | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => Promise<void>;
}

// Demo credentials (local mode). With Supabase configured, Supabase Auth is used instead.
export const DEMO_EMAIL = 'owner@novawheels.com';
export const DEMO_PASSWORD = 'nova2026';

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      signIn: async (email, password) => {
        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error || !data.user) return { ok: false, error: error?.message ?? 'Sign in failed' };
          set({ user: { id: data.user.id, name: data.user.user_metadata?.name ?? email.split('@')[0], email, role: 'owner' } });
          return { ok: true };
        }
        await new Promise((r) => setTimeout(r, 650));
        if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
          set({ user: { id: 'usr_owner', name: 'Owner', email: DEMO_EMAIL, role: 'owner' } });
          return { ok: true };
        }
        return { ok: false, error: 'That email and password do not match.' };
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut();
        set({ user: null });
      },
    }),
    { name: 'nw.auth', onRehydrateStorage: () => (s) => s && (s.hydrated = true) },
  ),
);

/* ---------------- settings ---------------- */
interface SettingsState {
  settings: CompanySettings;
  update: (patch: Partial<CompanySettings>) => void;
  updateDefaults: (patch: Partial<CompanySettings['defaults']>) => void;
  reset: () => void;
}
export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      update: (patch) => {
        const next = { ...get().settings, ...patch };
        set({ settings: next });
        setSoundEnabled(next.sounds);
        void mirror('company_settings', { id: 'default', data: next, updated_at: nowIso() });
      },
      updateDefaults: (patch) => get().update({ defaults: { ...get().settings.defaults, ...patch } }),
      reset: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'nw.settings',
      // Deep-merge so partial or older persisted settings never drop new defaults.
      merge: (persisted, current) => {
        const p: Partial<CompanySettings> = (persisted as { settings?: Partial<CompanySettings> } | undefined)?.settings ?? {};
        const merged: CompanySettings = { ...current.settings, ...p, defaults: { ...current.settings.defaults, ...(p.defaults ?? {}), fees: { ...current.settings.defaults.fees, ...(p.defaults?.fees ?? {}) }, rules: { ...current.settings.defaults.rules, ...(p.defaults?.rules ?? {}) } }, payments: { ...current.settings.payments, ...(p.payments ?? {}) } };
        return { ...current, settings: merged };
      },
      onRehydrateStorage: () => (s) => s && setSoundEnabled(s.settings.sounds),
    },
  ),
);

/* ---------------- fleet ---------------- */
interface FleetState {
  vehicles: Vehicle[];
  upsert: (v: Vehicle) => void;
  remove: (id: string) => void;
  setStatus: (id: string, status: Vehicle['status']) => void;
  byId: (id: string) => Vehicle | undefined;
  bySlug: (slug: string) => Vehicle | undefined;
  resetSeed: () => void;
}
export const useFleet = create<FleetState>()(
  persist(
    (set, get) => ({
      vehicles: SEED_VEHICLES,
      upsert: (v) => {
        const vehicles = get().vehicles.some((x) => x.id === v.id) ? get().vehicles.map((x) => (x.id === v.id ? { ...v, updatedAt: nowIso() } : x)) : [...get().vehicles, v];
        set({ vehicles });
        void mirror('vehicles', toRow(v));
      },
      remove: (id) => {
        set({ vehicles: get().vehicles.filter((v) => v.id !== id) });
        void mirrorDelete('vehicles', id);
      },
      setStatus: (id, status) => {
        const v = get().vehicles.find((x) => x.id === id);
        if (v) get().upsert({ ...v, status });
      },
      byId: (id) => get().vehicles.find((v) => v.id === id),
      bySlug: (slug) => get().vehicles.find((v) => v.slug === slug),
      resetSeed: () => set({ vehicles: SEED_VEHICLES }),
    }),
    { name: 'nw.fleet' },
  ),
);

/* ---------------- customers ---------------- */
interface CustomerState {
  customers: Customer[];
  upsert: (c: Customer) => void;
  remove: (id: string) => void;
  byId: (id: string) => Customer | undefined;
  findByEmailOrPhone: (email: string, phone: string) => Customer | undefined;
}
export const useCustomers = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: SEED_CUSTOMERS,
      upsert: (c) => {
        const exists = get().customers.some((x) => x.id === c.id);
        set({ customers: exists ? get().customers.map((x) => (x.id === c.id ? { ...c, updatedAt: nowIso() } : x)) : [...get().customers, c] });
        void mirror('customers', toRow(c));
      },
      remove: (id) => {
        set({ customers: get().customers.filter((c) => c.id !== id) });
        void mirrorDelete('customers', id);
      },
      byId: (id) => get().customers.find((c) => c.id === id),
      findByEmailOrPhone: (email, phone) => {
        const e = email.trim().toLowerCase();
        const p = phone.replace(/\D/g, '');
        return get().customers.find((c) => (e && c.email.toLowerCase() === e) || (p.length >= 10 && c.phone.replace(/\D/g, '') === p));
      },
    }),
    { name: 'nw.customers' },
  ),
);

/* ---------------- rentals ---------------- */
interface RentalState {
  rentals: Rental[];
  counter: number;
  nextNumber: () => string;
  upsert: (r: Rental) => void;
  remove: (id: string) => void;
  byId: (id: string) => Rental | undefined;
  byToken: (token: string) => Rental | undefined;
  log: (id: string, ev: Omit<RentalEvent, 'id' | 'at'> & { at?: string }) => void;
  patch: (id: string, fn: (r: Rental) => Rental) => void;
}
export const useRentals = create<RentalState>()(
  persist(
    (set, get) => ({
      rentals: SEED_RENTALS,
      counter: 43,
      nextNumber: () => {
        const n = get().counter + 1;
        set({ counter: n });
        return `NW-${new Date().getFullYear()}-${String(n).padStart(4, '0')}`;
      },
      upsert: (r) => {
        const exists = get().rentals.some((x) => x.id === r.id);
        const next = { ...r, updatedAt: nowIso() };
        set({ rentals: exists ? get().rentals.map((x) => (x.id === r.id ? next : x)) : [next, ...get().rentals] });
        void mirror('rentals', toRow(next));
      },
      remove: (id) => {
        set({ rentals: get().rentals.filter((r) => r.id !== id) });
        void mirrorDelete('rentals', id);
      },
      byId: (id) => get().rentals.find((r) => r.id === id),
      byToken: (token) => get().rentals.find((r) => r.signingToken === token),
      log: (id, ev) => {
        get().patch(id, (r) => ({ ...r, timeline: [...r.timeline, { id: uid('ev'), at: ev.at ?? nowIso(), type: ev.type, summary: ev.summary, meta: ev.meta, by: ev.by }] }));
      },
      patch: (id, fn) => {
        const r = get().rentals.find((x) => x.id === id);
        if (r) get().upsert(fn(r));
      },
    }),
    { name: 'nw.rentals' },
  ),
);

/* ---------------- templates ---------------- */
interface TemplateState {
  templates: ContractTemplate[];
  upsert: (t: ContractTemplate) => void;
  remove: (id: string) => void;
  byId: (id: string) => ContractTemplate | undefined;
  getDefault: () => ContractTemplate;
  setDefault: (id: string) => void;
}
export const useTemplates = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [DEFAULT_TEMPLATE],
      upsert: (t) => {
        const exists = get().templates.some((x) => x.id === t.id);
        const next = { ...t, updatedAt: nowIso() };
        set({ templates: exists ? get().templates.map((x) => (x.id === t.id ? next : x)) : [...get().templates, next] });
        void mirror('contract_templates', toRow(next));
      },
      remove: (id) => set({ templates: get().templates.filter((t) => t.id !== id || t.isDefault) }),
      byId: (id) => get().templates.find((t) => t.id === id),
      getDefault: () => get().templates.find((t) => t.isDefault) ?? get().templates[0] ?? DEFAULT_TEMPLATE,
      setDefault: (id) => set({ templates: get().templates.map((t) => ({ ...t, isDefault: t.id === id })) }),
    }),
    { name: 'nw.templates' },
  ),
);

/* ---------------- reservations (public site inquiries) ---------------- */
interface ReservationState {
  reservations: Reservation[];
  add: (r: Omit<Reservation, 'id' | 'createdAt' | 'status'>) => Reservation;
  setStatus: (id: string, status: Reservation['status']) => void;
}
export const useReservations = create<ReservationState>()(
  persist(
    (set, get) => ({
      reservations: [],
      add: (r) => {
        const res: Reservation = { ...r, id: uid('res'), createdAt: nowIso(), status: 'new' };
        set({ reservations: [res, ...get().reservations] });
        void mirror('reservations', toRow(res));
        return res;
      },
      setStatus: (id, status) => set({ reservations: get().reservations.map((r) => (r.id === id ? { ...r, status } : r)) }),
    }),
    { name: 'nw.reservations' },
  ),
);

/* ---------------- helpers ---------------- */
function toRow<T extends { id: string; createdAt?: string; updatedAt?: string }>(obj: T) {
  return { id: obj.id, data: obj, created_at: obj.createdAt ?? nowIso(), updated_at: obj.updatedAt ?? nowIso() };
}

/** On boot with Supabase configured, pull remote rows and replace local state. */
export async function hydrateFromSupabase() {
  if (!supabaseEnabled) return;
  const [v, c, r, t] = await Promise.all([
    pull<{ data: Vehicle }>('vehicles'),
    pull<{ data: Customer }>('customers'),
    pull<{ data: Rental }>('rentals'),
    pull<{ data: ContractTemplate }>('contract_templates'),
  ]);
  if (v && v.length) useFleet.setState({ vehicles: v.map((x) => x.data) });
  if (c && c.length) useCustomers.setState({ customers: c.map((x) => x.data) });
  if (r && r.length) useRentals.setState({ rentals: r.map((x) => x.data) });
  if (t && t.length) useTemplates.setState({ templates: t.map((x) => x.data) });
}
