import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdditionalDriver, Address, DepositMethod, DriverLicense, PaymentMethod, PaymentSchedule, RentalUnit, RenterInsurance, DamageMark, PhotoRef, Fees, Rules } from '@/lib/types';

// The Handle-a-Rental draft. One field group per screen.
export interface WizardDraft {
  rentalId?: string;
  vehicleId?: string;
  odometerOut?: number;
  fuelOut: number;
  damages: DamageMark[];
  photos: PhotoRef[];
  conditionNotes?: string;
  customerId?: string;
  firstName: string;
  middleName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  license: DriverLicense;
  address?: Address;
  insurance: RenterInsurance;
  additionalDrivers: AdditionalDriver[];
  startAt: string;
  unit: RentalUnit;
  quantity: number;
  rate: number;
  includedMilesPerDay: number;
  overagePerMile: number;
  discount: number;
  depositRequired: boolean | null;
  depositAmount: number;
  depositMethod: DepositMethod;
  collateralDescription: string;
  downPayment: number;
  paymentMethod: PaymentMethod;
  cardLast4: string;
  cardBrand: string;
  cardOnFileAuthorized: boolean;
  riskAcknowledged: boolean;
  schedule: PaymentSchedule;
  renewalIntent: 'none' | 'likely' | 'auto-renew';
  renewalRate: number;
  deliveryEnabled: boolean | null;
  deliveryAddress?: Address;
  deliveryFee: number;
  returnPickup: boolean;
  fees: Fees;
  rules: Rules;
  templateId?: string;
  signingMode?: 'in-person' | 'remote-link';
  lastStep: string;
}

const blankLicense: DriverLicense = { number: '', state: 'TX', expires: '' };

export const emptyDraft = (fees: Fees, rules: Rules): WizardDraft => ({
  fuelOut: 1,
  damages: [],
  photos: [],
  firstName: '', middleName: '', lastName: '', phone: '', email: '', dateOfBirth: '',
  license: { ...blankLicense },
  insurance: { mode: 'renter-policy' },
  additionalDrivers: [],
  startAt: nextHourIso(),
  unit: 'day', quantity: 3, rate: 0, includedMilesPerDay: 100, overagePerMile: 3, discount: 0,
  depositRequired: null, depositAmount: 0, depositMethod: 'card-hold', collateralDescription: '',
  downPayment: 0, paymentMethod: 'card-on-file', cardLast4: '', cardBrand: '', cardOnFileAuthorized: true, riskAcknowledged: false,
  schedule: 'upfront',
  renewalIntent: 'none', renewalRate: 0,
  deliveryEnabled: null, deliveryFee: fees.deliveryFee, returnPickup: false,
  fees, rules,
  lastStep: 'vehicle',
});

function nextHourIso() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}

interface WizardState {
  draft: WizardDraft | null;
  start: (fees: Fees, rules: Rules, seed?: Partial<WizardDraft>) => void;
  set: (patch: Partial<WizardDraft>) => void;
  clear: () => void;
}

export const useWizard = create<WizardState>()(
  persist(
    (set, get) => ({
      draft: null,
      start: (fees, rules, seed) => set({ draft: { ...emptyDraft(fees, rules), ...seed } }),
      set: (patch) => {
        const d = get().draft;
        if (d) set({ draft: { ...d, ...patch } });
      },
      clear: () => set({ draft: null }),
    }),
    { name: 'nw.wizard' },
  ),
);
