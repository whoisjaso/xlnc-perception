import { useState } from 'react';
import { useNavigate } from 'react-router';
import { StepShell, Choice } from '@/components/wizard/StepShell';
import { AddressInput } from '@/components/wizard/AddressInput';
import { Field, Input, MoneyInput, Segmented, Toggle } from '@/components/ui';
import { useSettings } from '@/store';
import type { Address } from '@/lib/types';
import { successChord } from '@/lib/sound';
import { formatPhone, isEmail, US_STATES } from '@/lib/util';

const STEPS = ['welcome', 'company', 'contact', 'lot', 'policies', 'payments', 'insurance', 'preferences', 'done'] as const;
type Step = (typeof STEPS)[number];

/** First-run setup, one question at a time, the way a phone sets itself up. */
export function Onboarding() {
  const { settings, update, updateDefaults } = useSettings();
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [legalName, setLegalName] = useState(settings.legalName);
  const [dba, setDba] = useState(settings.dba);
  const [email, setEmail] = useState(settings.email);
  const [phone, setPhone] = useState(settings.phone);
  const [lot, setLot] = useState<Address | undefined>(settings.lotAddress);
  const [state, setState] = useState(settings.governingState);
  const d = settings.defaults;
  const [minAge, setMinAge] = useState(d.minRenterAge);
  const [deposit, setDeposit] = useState(d.depositAmount);
  const [miles, setMiles] = useState(d.includedMilesPerDay);
  const [overage, setOverage] = useState(d.overagePerMile);
  const [release, setRelease] = useState(d.depositReleaseDays);
  const [pay, setPay] = useState(settings.payments);
  const [ins, setIns] = useState(d.insuranceRequirement);
  const [sounds, setSounds] = useState(settings.sounds);
  const [theme, setTheme] = useState(settings.theme);

  const i = STEPS.indexOf(step);
  const progress = i / (STEPS.length - 1);
  const next = () => setStep(STEPS[i + 1]);
  const back = i > 0 ? () => setStep(STEPS[i - 1]) : undefined;

  const finish = () => {
    update({ onboarded: true, legalName, dba, email, phone, lotAddress: lot, address: lot, governingState: state, sounds, theme, payments: pay });
    updateDefaults({ minRenterAge: minAge, depositAmount: deposit, includedMilesPerDay: miles, overagePerMile: overage, depositReleaseDays: release, insuranceRequirement: ins });
    successChord();
    nav('/admin', { replace: true });
  };

  switch (step) {
    case 'welcome':
      return (
        <StepShell title="Welcome. Let's set up your rental operation." subtitle="Eight questions. Everything here becomes a default you can change later in Settings." onNext={next} nextLabel="Begin" progress={progress} />
      );
    case 'company':
      return (
        <StepShell title="What is the company called?" subtitle="The legal name goes on contracts. The trading name goes everywhere else." onNext={next} onBack={back} canNext={legalName.trim().length > 1} progress={progress}>
          <div className="flex flex-col gap-6">
            <input className="field" placeholder="Legal name (e.g. Nova Wheels LLC)" value={legalName} onChange={(e) => setLegalName(e.target.value)} aria-label="Legal name" />
            <input className="field" placeholder="Trading name (e.g. Nova Wheels)" value={dba} onChange={(e) => setDba(e.target.value)} aria-label="Trading name" />
          </div>
        </StepShell>
      );
    case 'contact':
      return (
        <StepShell title="How do renters reach you?" subtitle="Printed on every agreement and used for signing links." onNext={next} onBack={back} canNext={isEmail(email) && phone.replace(/\D/g, '').length >= 10} progress={progress}>
          <div className="flex flex-col gap-6">
            <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
            <input className="field" type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} aria-label="Phone" />
          </div>
        </StepShell>
      );
    case 'lot':
      return (
        <StepShell title="Where do cars leave from and come back to?" subtitle="This is the return location in the contract, and the state whose law governs it." onNext={next} onBack={back} canNext={!!lot?.line1} progress={progress}>
          <div className="flex flex-col gap-8">
            <AddressInput value={lot} onChange={(a) => { setLot(a); if (a?.state) setState(a.state); }} autoFocus />
            <Field label="Governing state" htmlFor="gov">
              <select id="gov" className="field-box max-w-[160px]" value={state} onChange={(e) => setState(e.target.value)}>{US_STATES.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
          </div>
        </StepShell>
      );
    case 'policies':
      return (
        <StepShell title="Your house rules." subtitle="Defaults for every new rental. Each one can be changed per car and per rental." onNext={next} onBack={back} progress={progress} wide>
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
            <Field label="Minimum renter age" htmlFor="age"><Input id="age" type="number" min={18} max={40} value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} /></Field>
            <Field label="Default security deposit" htmlFor="dep"><MoneyInput id="dep" value={deposit} onChange={setDeposit} /></Field>
            <Field label="Included miles per day" htmlFor="mi"><Input id="mi" type="number" min={0} value={miles} onChange={(e) => setMiles(Number(e.target.value))} /></Field>
            <Field label="Overage per mile" htmlFor="ov"><MoneyInput id="ov" value={overage} onChange={setOverage} /></Field>
            <Field label="Deposit release, business days after return" htmlFor="rel" hint="Five is the number renters expect. Longer invites chargebacks."><Input id="rel" type="number" min={1} max={30} value={release} onChange={(e) => setRelease(Number(e.target.value))} /></Field>
          </div>
        </StepShell>
      );
    case 'payments':
      return (
        <StepShell title="How do you take money?" subtitle="Card on file is the only method that lets you recover tolls, tickets, and damage after the car is back. Everything else is a courtesy." onNext={next} onBack={back} progress={progress}>
          <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
            <Toggle id="p1" label="Credit and debit cards" description="Required for deposits and post-return charges." checked={pay.acceptCard} onChange={(v) => setPay({ ...pay, acceptCard: v })} />
            <Toggle id="p2" label="Bank transfer (ACH)" checked={pay.acceptAch} onChange={(v) => setPay({ ...pay, acceptAch: v })} />
            <Toggle id="p3" label="Wire" checked={pay.acceptWire} onChange={(v) => setPay({ ...pay, acceptWire: v })} />
            <Toggle id="p4" label="Cash" description="Never for the deposit." checked={pay.acceptCash} onChange={(v) => setPay({ ...pay, acceptCash: v })} />
            <Toggle id="p5" label="Zelle" description="Not disputable, not trackable. The app will require a card on file alongside it." checked={pay.acceptZelle} onChange={(v) => setPay({ ...pay, acceptZelle: v })} />
            <Toggle id="p6" label="Cash App" description="Same caveat as Zelle." checked={pay.acceptCashApp} onChange={(v) => setPay({ ...pay, acceptCashApp: v })} />
            <Toggle id="p7" label="Crypto" checked={pay.acceptCrypto} onChange={(v) => setPay({ ...pay, acceptCrypto: v })} />
            <Toggle id="p8" label="Always require a card on file" description="Even when the rental itself is paid another way. Strongly recommended." checked={pay.requireCardOnFile} onChange={(v) => setPay({ ...pay, requireCardOnFile: v })} />
          </div>
        </StepShell>
      );
    case 'insurance':
      return (
        <StepShell title="Who insures the car while it is out?" onNext={next} onBack={back} progress={progress}>
          <Choice
            value={ins}
            onChange={(v) => setIns(v)}
            columns={1}
            options={[
              { value: 'renter-policy', label: "Renter's own full-coverage policy", hint: 'Verify the declarations page. Their policy is primary; yours is excess. Lowest cost to you.' },
              { value: 'company-cdw', label: 'Your damage waiver', hint: 'You charge a waiver fee and cap the renter at a deductible. Needs a commercial rental policy behind it.' },
              { value: 'either', label: 'Either, chosen per rental', hint: 'The wizard will ask each time.' },
            ]}
          />
        </StepShell>
      );
    case 'preferences':
      return (
        <StepShell title="A few preferences." onNext={next} onBack={back} progress={progress}>
          <div className="flex flex-col gap-6">
            <Toggle id="snd" label="Keyboard and confirmation sounds" description="Quiet mechanical clicks while typing through a rental. Synthesized, no files." checked={sounds} onChange={setSounds} />
            <div className="flex items-center justify-between py-3">
              <span className="text-[15px] font-medium">Appearance</span>
              <Segmented ariaLabel="Appearance" value={theme} onChange={setTheme} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
            </div>
          </div>
        </StepShell>
      );
    case 'done':
      return (
        <StepShell title="You're set." subtitle={`${dba || legalName} is ready to handle its first rental. The fleet comes preloaded with twelve cars you can edit or replace.`} onNext={finish} onBack={back} nextLabel="Open the hub" progress={1} />
      );
  }
}
