import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Page, PageHeader } from '@/components/admin/AdminLayout';
import { Button, Field, Input, MoneyInput, Select, Textarea, Toggle, Pill } from '@/components/ui';
import { VehicleImage } from '@/components/site/VehicleImage';
import { useFleet, useRentals } from '@/store';
import type { Vehicle, VehicleClass, VehicleStatus } from '@/lib/types';
import { decodeVin } from '@/lib/vin';
import { compressImage } from '@/lib/image';
import { nowIso, slugify, uid, validVin, US_STATES } from '@/lib/util';
import { VSTATUS } from './Inventory';
import { successChord, errorTone } from '@/lib/sound';
import { format } from 'date-fns';

const CLASSES: { value: VehicleClass; label: string }[] = [{ value: 'supercar', label: 'Supercar' }, { value: 'grand-tourer', label: 'Grand tourer' }, { value: 'luxury-sedan', label: 'Luxury sedan' }, { value: 'luxury-suv', label: 'Luxury SUV' }, { value: 'convertible', label: 'Convertible' }, { value: 'ev', label: 'Electric' }, { value: 'classic', label: 'Classic' }];

const blank = (): Vehicle => ({ id: uid('veh'), slug: '', vin: '', year: new Date().getFullYear(), make: '', model: '', color: '', class: 'supercar', status: 'available', odometer: 0, rates: { daily: 0, weekly: 0, monthly: 0 }, depositDefault: 2500, includedMilesPerDay: 100, overagePerMile: 3, minRenterAge: 25, gps: { starterInterrupt: false }, createdAt: nowIso(), updatedAt: nowIso() });

export function VehicleForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const fleet = useFleet();
  const rentals = useRentals((s) => s.rentals);
  const existing = id ? fleet.byId(id) : undefined;
  const [v, setV] = useState<Vehicle>(existing ?? blank());
  const [decoding, setDecoding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const isNew = !existing;
  const set = (p: Partial<Vehicle>) => setV((x) => ({ ...x, ...p }));
  const history = rentals.filter((r) => r.vehicleId === v.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const decode = async () => {
    setMsg(null);
    if (!validVin(v.vin)) { setMsg('That is not a valid VIN. VINs never contain I, O, or Q.'); errorTone(); return; }
    setDecoding(true);
    try {
      const r = await decodeVin(v.vin);
      if (!r.make) throw new Error(r.errorText ?? 'No match.');
      set({ year: r.year ?? v.year, make: r.make, model: r.model ?? v.model, trim: r.trim ?? v.trim, bodyClass: r.bodyClass, fuelType: r.fuelType, transmission: r.transmission, drive: r.drive, horsepower: r.horsepower ?? v.horsepower, seats: r.seats ?? v.seats });
      setMsg(`Decoded: ${r.year ?? ''} ${r.make} ${r.model ?? ''}${r.engine ? `, ${r.engine}` : ''}.`);
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Decoder unavailable.'); errorTone(); } finally { setDecoding(false); }
  };

  const save = () => {
    if (!v.make || !v.model || !v.vin) { setMsg('Make, model, and VIN are required.'); errorTone(); return; }
    const slug = v.slug || slugify(`${v.make} ${v.model} ${v.year}`);
    fleet.upsert({ ...v, slug, heroImage: v.heroImage ?? `/media/vehicles/${slug}.jpg` });
    successChord();
    nav(`/admin/inventory/${v.id}`, { replace: true });
    if (isNew) setMsg('Saved.');
  };

  const onPhoto = async (f: File | undefined) => { if (f) set({ heroImage: await compressImage(f, 1600, 0.85) }); };

  return (
    <Page wide>
      <title>{`${isNew ? 'Add a vehicle' : `${v.year} ${v.make} ${v.model}`}. Nova Wheels`}</title>
      <PageHeader title={isNew ? 'Add a vehicle' : `${v.year} ${v.make} ${v.model}`} subtitle={isNew ? 'Paste the VIN. The decoder fills in year, make, model, engine, and body.' : v.vin} actions={<>
        {!isNew && <Pill tone={VSTATUS[v.status].tone}>{VSTATUS[v.status].label}</Pill>}
        <Link to="/admin/inventory" className="btn btn-quiet btn-sm">Inventory</Link>
        <Button variant="accent" size="sm" onClick={save}>Save</Button>
      </>} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="flex flex-col gap-8">
          <section className="rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="text-[15px] font-medium mb-4">Identity</h2>
            <div className="grid sm:grid-cols-6 gap-4">
              <Field label="VIN" htmlFor="vin" required><div className="flex gap-2"><Input id="vin" className="font-mono uppercase" maxLength={17} value={v.vin} onChange={(e) => set({ vin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} /><Button variant="ghost" onClick={() => void decode()} loading={decoding} disabled={v.vin.length !== 17}>Decode</Button></div></Field>
              <div className="sm:col-span-6 -mt-2">{msg && <p className="text-[13px]" style={{ color: msg.startsWith('Decoded') || msg === 'Saved.' ? 'var(--color-ok)' : 'var(--color-danger)' }}>{msg}</p>}</div>
              <Field label="Year" htmlFor="yr" required><Input id="yr" type="number" value={v.year} onChange={(e) => set({ year: Number(e.target.value) })} /></Field>
              <div className="sm:col-span-2"><Field label="Make" htmlFor="mk" required><Input id="mk" value={v.make} onChange={(e) => set({ make: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Model" htmlFor="md" required><Input id="md" value={v.model} onChange={(e) => set({ model: e.target.value })} /></Field></div>
              <Field label="Trim" htmlFor="tr"><Input id="tr" value={v.trim ?? ''} onChange={(e) => set({ trim: e.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="Exterior color" htmlFor="col" required><Input id="col" value={v.color} onChange={(e) => set({ color: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Interior" htmlFor="int"><Input id="int" value={v.interior ?? ''} onChange={(e) => set({ interior: e.target.value })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Class" htmlFor="cls"><Select id="cls" value={v.class} onChange={(e) => set({ class: e.target.value as VehicleClass })}>{CLASSES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select></Field></div>
              <div className="sm:col-span-2"><Field label="Plate" htmlFor="pl"><Input id="pl" value={v.plate ?? ''} onChange={(e) => set({ plate: e.target.value.toUpperCase() })} /></Field></div>
              <Field label="Plate state" htmlFor="ps"><Select id="ps" value={v.plateState ?? 'TX'} onChange={(e) => set({ plateState: e.target.value })}>{US_STATES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <div className="sm:col-span-3"><Field label="Status" htmlFor="st"><Select id="st" value={v.status} onChange={(e) => set({ status: e.target.value as VehicleStatus })}>{(Object.keys(VSTATUS) as VehicleStatus[]).map((s) => <option key={s} value={s}>{VSTATUS[s].label}</option>)}</Select></Field></div>
              <div className="sm:col-span-2"><Field label="Odometer" htmlFor="od"><Input id="od" type="number" className="tabular" value={v.odometer} onChange={(e) => set({ odometer: Number(e.target.value) })} /></Field></div>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="text-[15px] font-medium mb-4">Rates and terms</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Daily" htmlFor="rd"><MoneyInput id="rd" value={v.rates.daily} onChange={(n) => set({ rates: { ...v.rates, daily: n } })} /></Field>
              <Field label="Weekly" htmlFor="rw"><MoneyInput id="rw" value={v.rates.weekly} onChange={(n) => set({ rates: { ...v.rates, weekly: n } })} /></Field>
              <Field label="Monthly" htmlFor="rm"><MoneyInput id="rm" value={v.rates.monthly} onChange={(n) => set({ rates: { ...v.rates, monthly: n } })} /></Field>
              <Field label="Default deposit" htmlFor="dp"><MoneyInput id="dp" value={v.depositDefault} onChange={(n) => set({ depositDefault: n })} /></Field>
              <Field label="Miles per day" htmlFor="mpd"><Input id="mpd" type="number" value={v.includedMilesPerDay} onChange={(e) => set({ includedMilesPerDay: Number(e.target.value) })} /></Field>
              <Field label="Overage per mile" htmlFor="opm"><MoneyInput id="opm" value={v.overagePerMile} onChange={(n) => set({ overagePerMile: n })} /></Field>
              <Field label="Minimum renter age" htmlFor="ma"><Input id="ma" type="number" value={v.minRenterAge} onChange={(e) => set({ minRenterAge: Number(e.target.value) })} /></Field>
            </div>
            <div className="mt-2"><Toggle id="feat" label="Featured on the website" checked={!!v.featured} onChange={(x) => set({ featured: x })} /></div>
          </section>

          <section className="rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="text-[15px] font-medium mb-4">Tracking, insurance, service</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="GPS provider" htmlFor="gp"><Input id="gp" value={v.gps?.provider ?? ''} onChange={(e) => set({ gps: { ...(v.gps ?? { starterInterrupt: false }), provider: e.target.value } })} placeholder="Trackhawk, Bouncie, PassTime" /></Field>
              <Field label="Device ID" htmlFor="gd"><Input id="gd" className="font-mono" value={v.gps?.deviceId ?? ''} onChange={(e) => set({ gps: { ...(v.gps ?? { starterInterrupt: false }), deviceId: e.target.value } })} /></Field>
              <div className="self-end"><Toggle id="si" label="Starter interrupt installed" checked={!!v.gps?.starterInterrupt} onChange={(x) => set({ gps: { ...(v.gps ?? {}), starterInterrupt: x } })} /></div>
              <Field label="Insurance carrier" htmlFor="ic"><Input id="ic" value={v.insurance?.carrier ?? ''} onChange={(e) => set({ insurance: { ...v.insurance, carrier: e.target.value } })} /></Field>
              <Field label="Policy" htmlFor="ip"><Input id="ip" className="font-mono" value={v.insurance?.policyNumber ?? ''} onChange={(e) => set({ insurance: { ...v.insurance, policyNumber: e.target.value } })} /></Field>
              <Field label="Policy expires" htmlFor="ie"><Input id="ie" type="date" value={v.insurance?.expires ?? ''} onChange={(e) => set({ insurance: { ...v.insurance, expires: e.target.value } })} /></Field>
              <Field label="Registration expires" htmlFor="re"><Input id="re" type="date" value={v.registrationExpires ?? ''} onChange={(e) => set({ registrationExpires: e.target.value })} /></Field>
              <Field label="Next service at" htmlFor="ns"><Input id="ns" type="number" className="tabular" value={v.nextServiceMiles ?? ''} onChange={(e) => set({ nextServiceMiles: Number(e.target.value) || undefined })} placeholder="miles" /></Field>
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            <h2 className="text-[15px] font-medium mb-4">Website copy and specs</h2>
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="sm:col-span-4"><Field label="Tagline" htmlFor="tg"><Input id="tg" value={v.tagline ?? ''} onChange={(e) => set({ tagline: e.target.value })} /></Field></div>
              <div className="sm:col-span-4"><Field label="Description" htmlFor="ds"><Textarea id="ds" value={v.description ?? ''} onChange={(e) => set({ description: e.target.value })} /></Field></div>
              <Field label="Horsepower" htmlFor="hp"><Input id="hp" type="number" value={v.horsepower ?? ''} onChange={(e) => set({ horsepower: Number(e.target.value) || undefined })} /></Field>
              <Field label="0 to 60, s" htmlFor="z6"><Input id="z6" type="number" step="0.1" value={v.zeroToSixty ?? ''} onChange={(e) => set({ zeroToSixty: Number(e.target.value) || undefined })} /></Field>
              <Field label="Top speed, mph" htmlFor="ts"><Input id="ts" type="number" value={v.topSpeed ?? ''} onChange={(e) => set({ topSpeed: Number(e.target.value) || undefined })} /></Field>
              <Field label="Seats" htmlFor="se"><Input id="se" type="number" value={v.seats ?? ''} onChange={(e) => set({ seats: Number(e.target.value) || undefined })} /></Field>
              <div className="sm:col-span-2"><Field label="Transmission" htmlFor="tx"><Input id="tx" value={v.transmission ?? ''} onChange={(e) => set({ transmission: e.target.value })} /></Field></div>
              <Field label="Drive" htmlFor="dr"><Input id="dr" value={v.drive ?? ''} onChange={(e) => set({ drive: e.target.value })} /></Field>
              <Field label="Fuel" htmlFor="fl"><Input id="fl" value={v.fuelType ?? ''} onChange={(e) => set({ fuelType: e.target.value })} /></Field>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-20">
          <section className="rounded-[var(--radius-lg)] overflow-hidden" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
            <div className="aspect-[4/3]"><VehicleImage vehicle={v} plateClass="plate-light" className="w-full h-full" /></div>
            <div className="p-4">
              <label className="btn btn-ghost btn-sm cursor-pointer">Upload hero photo<input type="file" accept="image/*" className="sr-only" onChange={(e) => void onPhoto(e.target.files?.[0])} /></label>
              <p className="mt-3 text-[12px]" style={{ color: 'var(--fg-3)' }}>Or drop a file at <span className="font-mono">public/media/vehicles/{v.slug || slugify(`${v.make} ${v.model} ${v.year}`) || 'slug'}.jpg</span>. 2400×1500, dark background, three-quarter front.</p>
            </div>
          </section>
          {!isNew && (
            <section className="rounded-[var(--radius-lg)] p-5" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}>
              <h2 className="text-[15px] font-medium mb-3">Rental history</h2>
              {history.length === 0 ? <p className="text-[14px]" style={{ color: 'var(--fg-3)' }}>No rentals yet.</p> : (
                <ul className="flex flex-col text-[14px]">
                  {history.map((r, i) => <li key={r.id} className="py-2 flex justify-between gap-3" style={{ borderTop: i ? '1px solid var(--line)' : undefined }}><Link to={`/admin/rentals/${r.id}`} className="hover:underline underline-offset-4 tabular">{r.number}</Link><span style={{ color: 'var(--fg-3)' }}>{format(new Date(r.terms.startAt), 'MMM d')} to {format(new Date(r.terms.endAt), 'MMM d')}</span></li>)}
                </ul>
              )}
            </section>
          )}
          {!isNew && v.status !== 'rented' && (
            <Button variant="quiet" size="sm" onClick={() => { if (window.confirm('Remove this vehicle from inventory? Rental history is kept.')) { fleet.remove(v.id); nav('/admin/inventory'); } }}>Remove vehicle</Button>
          )}
        </div>
      </div>
    </Page>
  );
}
