import { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { useCustomers, useFleet, useSettings, useTemplates } from '@/store';
import { useWizard, type WizardDraft } from '@/store/wizard';
import { VehicleStep, ConditionStep, NameStep, ContactStep, LicenseStep, AddressStep, InsuranceStep, DriversStep } from './steps1';
import { TermStep, RateStep, MileageStep, DepositStep, DepositAmountStep, DownPaymentStep, PaymentMethodStep, ScheduleStep, RenewalStep, DeliveryStep, RulesStep } from './steps2';
import { ReviewStep, SignStep, DoneStep } from './steps3';

export const STEPS = [
  'vehicle', 'condition', 'name', 'contact', 'license', 'address', 'insurance', 'drivers',
  'term', 'rate', 'mileage', 'deposit', 'deposit-amount', 'down-payment', 'payment-method', 'schedule', 'renewal', 'delivery', 'rules',
  'review', 'sign', 'done',
] as const;
export type StepId = (typeof STEPS)[number];

export interface StepProps {
  draft: WizardDraft;
  set: (p: Partial<WizardDraft>) => void;
  next: (to?: StepId) => void;
  back: () => void;
  progress: number;
}

/** The Handle-a-Rental flow. Each URL is one question. */
export function HandleRental() {
  const { step = 'vehicle' } = useParams<{ step: StepId }>();
  const nav = useNavigate();
  const { draft, start, set } = useWizard();
  const settings = useSettings((s) => s.settings);
  const vehicles = useFleet((s) => s.vehicles);
  const customers = useCustomers((s) => s.customers);
  const template = useTemplates((s) => s.getDefault());

  useEffect(() => {
    if (!draft) start(settings.defaults.fees, settings.defaults.rules, { includedMilesPerDay: settings.defaults.includedMilesPerDay, overagePerMile: settings.defaults.overagePerMile, depositAmount: settings.defaults.depositAmount, templateId: template.id, insurance: { mode: settings.defaults.insuranceRequirement === 'company-cdw' ? 'company-cdw' : 'renter-policy' } });
  }, [draft, start, settings, template.id]);

  const idx = STEPS.indexOf(step as StepId);
  const progress = useMemo(() => (idx < 0 ? 0 : idx / (STEPS.length - 1)), [idx]);

  if (idx < 0) return <Navigate to="/admin/rental/new/vehicle" replace />;
  if (!draft) return null;

  const go = (s: StepId) => { set({ lastStep: s }); nav(`/admin/rental/new/${s}`); };
  const next = (to?: StepId) => {
    if (to) return go(to);
    let n = STEPS[idx + 1];
    if (n === 'deposit-amount' && draft.depositRequired === false) n = 'down-payment';
    go(n);
  };
  const back = () => {
    if (idx === 0) return nav('/admin');
    let p = STEPS[Math.max(0, idx - 1)];
    if (p === 'deposit-amount' && draft.depositRequired === false) p = 'deposit';
    go(p);
  };
  const props: StepProps = { draft, set, next, back, progress };

  const vehicle = vehicles.find((v) => v.id === draft.vehicleId);
  if (!vehicle && idx > 0 && step !== 'done') return <Navigate to="/admin/rental/new/vehicle" replace />;

  switch (step as StepId) {
    case 'vehicle': return <VehicleStep {...props} />;
    case 'condition': return <ConditionStep {...props} vehicle={vehicle!} />;
    case 'name': return <NameStep {...props} />;
    case 'contact': return <ContactStep {...props} customers={customers} />;
    case 'license': return <LicenseStep {...props} vehicle={vehicle!} minAge={settings.defaults.minRenterAge} />;
    case 'address': return <AddressStep {...props} />;
    case 'insurance': return <InsuranceStep {...props} requirement={settings.defaults.insuranceRequirement} />;
    case 'drivers': return <DriversStep {...props} />;
    case 'term': return <TermStep {...props} />;
    case 'rate': return <RateStep {...props} vehicle={vehicle!} />;
    case 'mileage': return <MileageStep {...props} vehicle={vehicle!} />;
    case 'deposit': return <DepositStep {...props} vehicle={vehicle!} />;
    case 'deposit-amount': return <DepositAmountStep {...props} vehicle={vehicle!} />;
    case 'down-payment': return <DownPaymentStep {...props} vehicle={vehicle!} />;
    case 'payment-method': return <PaymentMethodStep {...props} settings={settings} />;
    case 'schedule': return <ScheduleStep {...props} vehicle={vehicle!} settings={settings} />;
    case 'renewal': return <RenewalStep {...props} />;
    case 'delivery': return <DeliveryStep {...props} />;
    case 'rules': return <RulesStep {...props} settings={settings} />;
    case 'review': return <ReviewStep {...props} vehicle={vehicle!} settings={settings} />;
    case 'sign': return <SignStep {...props} vehicle={vehicle!} settings={settings} />;
    case 'done': return <DoneStep {...props} />;
  }
}
