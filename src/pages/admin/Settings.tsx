import { useState } from 'react';
import { Page, PageHeader } from '@/components/admin/AdminLayout';
import { Button, Field, Input, MoneyInput, Segmented, Toggle } from '@/components/ui';
import { AddressInput } from '@/components/wizard/AddressInput';
import { useFleet, useSettings } from '@/store';
import { supabaseEnabled } from '@/lib/supabase';
import { US_STATES } from '@/lib/util';
import { successChord, tick } from '@/lib/sound';

export function Settings() {
  const { settings, update, updateDefaults } = useSettings();
  const resetFleet = useFleet((s) => s.resetSeed);
  const [s, setS] = useState(settings);
  const d = s.defaults;
  const save = () => { update({ ...s, defaults: undefined as never }); updateDefaults(d); successChord(); };
  const setD = (p: Partial<typeof d>) => setS({ ...s, defaults: { ...d, ...p } });
  const setFees = (p: Partial<typeof d.fees>) => setD({ fees: { ...d.fees, ...p } });
  const setRules = (p: Partial<typeof d.rules>) => setD({ rules: { ...d.rules, ...p } });
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-[var(--radius-lg)] p-6" style={{ background: 'var(--surface)', boxShadow: 'var(--shadow-1)' }}><h2 className="text-[15px] font-medium mb-4">{title}</h2>{children}</section>
  );
  return (
    <Page>
      <title>Settings. Nova Wheels</title>
      <PageHeader title="Settings" subtitle={supabaseEnabled ? 'Synced to Supabase.' : 'Local mode: data lives in this browser until Supabase is connected in .env.'} actions={<Button variant="accent" onClick={save}>Save</Button>} />
      <div className="flex flex-col gap-6">
        <Section title="Company">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Legal name" htmlFor="ln"><Input id="ln" value={s.legalName} onChange={(e) => setS({ ...s, legalName: e.target.value })} /></Field>
            <Field label="Trading name" htmlFor="dba"><Input id="dba" value={s.dba} onChange={(e) => setS({ ...s, dba: e.target.value })} /></Field>
            <Field label="Email" htmlFor="em"><Input id="em" type="email" value={s.email} onChange={(e) => setS({ ...s, email: e.target.value })} /></Field>
            <Field label="Phone" htmlFor="ph"><Input id="ph" value={s.phone} onChange={(e) => setS({ ...s, phone: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Field label="Lot address" htmlFor="lot"><AddressInput value={s.lotAddress} onChange={(a) => setS({ ...s, lotAddress: a, address: a })} line={false} /></Field></div>
            <Field label="Governing state" htmlFor="gs"><select id="gs" className="field-box" value={s.governingState} onChange={(e) => setS({ ...s, governingState: e.target.value })}>{US_STATES.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Sales tax rate, %" htmlFor="tx"><Input id="tx" type="number" step="0.01" value={(s.taxRate * 100).toFixed(2)} onChange={(e) => setS({ ...s, taxRate: Number(e.target.value) / 100 })} /></Field>
          </div>
          <div className="mt-2"><Toggle id="arb" label="Binding arbitration clause" description="Individual arbitration with class-action waiver. Turn off to use local courts instead." checked={s.arbitration} onChange={(v) => setS({ ...s, arbitration: v })} /></div>
        </Section>
        <Section title="Rental defaults">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Minimum age" htmlFor="ma"><Input id="ma" type="number" value={d.minRenterAge} onChange={(e) => setD({ minRenterAge: Number(e.target.value) })} /></Field>
            <Field label="Default deposit" htmlFor="dd"><MoneyInput id="dd" value={d.depositAmount} onChange={(n) => setD({ depositAmount: n })} /></Field>
            <Field label="Deposit release, business days" htmlFor="dr"><Input id="dr" type="number" value={d.depositReleaseDays} onChange={(e) => setD({ depositReleaseDays: Number(e.target.value) })} /></Field>
            <Field label="Miles per day" htmlFor="mpd"><Input id="mpd" type="number" value={d.includedMilesPerDay} onChange={(e) => setD({ includedMilesPerDay: Number(e.target.value) })} /></Field>
            <Field label="Overage per mile" htmlFor="opm"><MoneyInput id="opm" value={d.overagePerMile} onChange={(n) => setD({ overagePerMile: n })} /></Field>
            <Field label="Post-return charge window, days" htmlFor="pw" hint="How long the card-on-file authorization survives return."><Input id="pw" type="number" value={d.postReturnChargeWindowDays} onChange={(e) => setD({ postReturnChargeWindowDays: Number(e.target.value) })} /></Field>
          </div>
        </Section>
        <Section title="Fees">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Late fee per hour" htmlFor="lf"><MoneyInput id="lf" value={d.fees.lateFeePerHour} onChange={(n) => setFees({ lateFeePerHour: n })} /></Field>
            <Field label="Grace minutes" htmlFor="gm"><Input id="gm" type="number" value={d.fees.lateGraceMinutes} onChange={(e) => setFees({ lateGraceMinutes: Number(e.target.value) })} /></Field>
            <Field label="Cleaning" htmlFor="cl"><MoneyInput id="cl" value={d.fees.cleaningFee} onChange={(n) => setFees({ cleaningFee: n })} /></Field>
            <Field label="Smoking" htmlFor="sm"><MoneyInput id="sm" value={d.fees.smokingFee} onChange={(n) => setFees({ smokingFee: n })} /></Field>
            <Field label="Toll admin, per event" htmlFor="ta"><MoneyInput id="ta" value={d.fees.tollAdminFee} onChange={(n) => setFees({ tollAdminFee: n })} /></Field>
            <Field label="Citation admin" htmlFor="ca"><MoneyInput id="ca" value={d.fees.ticketAdminFee} onChange={(n) => setFees({ ticketAdminFee: n })} /></Field>
            <Field label="Fuel per eighth" htmlFor="fe"><MoneyInput id="fe" value={d.fees.fuelRefillPerEighth} onChange={(n) => setFees({ fuelRefillPerEighth: n })} /></Field>
            <Field label="Additional driver" htmlFor="ad"><MoneyInput id="ad" value={d.fees.additionalDriverFee} onChange={(n) => setFees({ additionalDriverFee: n })} /></Field>
            <Field label="Delivery" htmlFor="de"><MoneyInput id="de" value={d.fees.deliveryFee} onChange={(n) => setFees({ deliveryFee: n })} /></Field>
          </div>
        </Section>
        <Section title="Rules">
          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            <Toggle id="gps" label="GPS disclosure and consent" checked={d.rules.gpsConsent} onChange={(v) => setRules({ gpsConsent: v })} />
            <Toggle id="si" label="Starter interrupt on default" checked={d.rules.starterInterruptConsent} onChange={(v) => setRules({ starterInterruptConsent: v })} />
            <Toggle id="pets" label="Pets allowed" checked={d.rules.petsAllowed} onChange={(v) => setRules({ petsAllowed: v })} />
            <Toggle id="sub" label="Sublease prohibited" checked={d.rules.subleaseProhibited} onChange={(v) => setRules({ subleaseProhibited: v })} />
          </div>
        </Section>
        <Section title="Payments accepted">
          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            {([['acceptCard', 'Cards'], ['acceptAch', 'ACH'], ['acceptWire', 'Wire'], ['acceptCash', 'Cash'], ['acceptZelle', 'Zelle'], ['acceptCashApp', 'Cash App'], ['acceptCrypto', 'Crypto'], ['requireCardOnFile', 'Always require a card on file']] as const).map(([k, l]) => (
              <Toggle key={k} id={k} label={l} checked={s.payments[k]} onChange={(v) => setS({ ...s, payments: { ...s.payments, [k]: v } })} />
            ))}
          </div>
        </Section>
        <Section title="Preferences">
          <Toggle id="snd" label="Keyboard and confirmation sounds" checked={s.sounds} onChange={(v) => { setS({ ...s, sounds: v }); update({ sounds: v }); tick(); }} />
          <div className="flex items-center justify-between py-3"><span className="text-[15px] font-medium">Appearance</span><Segmented ariaLabel="Appearance" value={s.theme} onChange={(v) => { setS({ ...s, theme: v }); update({ theme: v }); }} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} /></div>
        </Section>
        <Section title="Data">
          <p className="text-[14px] mb-4" style={{ color: 'var(--fg-2)' }}>Restore the twelve sample vehicles, or wipe this browser's data and start over. Rentals and customers are kept.</p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { if (window.confirm('Replace the current fleet with the twelve sample vehicles?')) resetFleet(); }}>Reset sample fleet</Button>
            <Button size="sm" variant="quiet" onClick={() => { if (window.confirm('Erase everything stored in this browser, including rentals, customers, and settings?')) { Object.keys(localStorage).filter((k) => k.startsWith('nw.')).forEach((k) => localStorage.removeItem(k)); window.location.href = '/admin'; } }}>Erase local data</Button>
          </div>
        </Section>
      </div>
    </Page>
  );
}
