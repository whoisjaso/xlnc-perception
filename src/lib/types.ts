// Nova Wheels domain types. Everything the operator touches lives here.

export type ID = string;

export type VehicleStatus = 'available' | 'rented' | 'reserved' | 'maintenance' | 'transit' | 'retired';
export type VehicleClass = 'supercar' | 'grand-tourer' | 'luxury-sedan' | 'luxury-suv' | 'convertible' | 'ev' | 'classic';

export interface Vehicle {
  id: ID;
  slug: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  bodyClass?: string;
  color: string;
  interior?: string;
  plate?: string;
  plateState?: string;
  class: VehicleClass;
  status: VehicleStatus;
  odometer: number;
  fuelType?: string;
  transmission?: string;
  drive?: string;
  horsepower?: number;
  zeroToSixty?: number;
  topSpeed?: number;
  seats?: number;
  rates: { daily: number; weekly: number; monthly: number };
  depositDefault: number;
  includedMilesPerDay: number;
  overagePerMile: number;
  minRenterAge: number;
  gps?: { provider?: string; deviceId?: string; starterInterrupt: boolean };
  insurance?: { carrier?: string; policyNumber?: string; expires?: string };
  registrationExpires?: string;
  nextServiceMiles?: number;
  heroImage?: string;
  gallery?: string[];
  tagline?: string;
  description?: string;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formatted?: string;
  lat?: number;
  lng?: number;
}

export interface DriverLicense {
  number: string;
  state: string;
  expires: string; // ISO date
  issued?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  scanFront?: string;
  scanBack?: string;
}

export type CustomerFlag = 'vip' | 'watch' | 'do-not-rent';

export interface Customer {
  id: ID;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: Address;
  license?: DriverLicense;
  insurance?: RenterInsurance;
  flags: CustomerFlag[];
  notes?: string;
  rentalCount: number;
  lifetimeValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface RenterInsurance {
  mode: 'renter-policy' | 'company-cdw' | 'both';
  carrier?: string;
  policyNumber?: string;
  expires?: string;
  liabilityLimits?: string; // e.g. 100/300/100
  transfersToRental?: boolean;
  declarationsPage?: string;
  verifiedAt?: string;
}

export interface AdditionalDriver {
  id: ID;
  firstName: string;
  lastName: string;
  license: DriverLicense;
  phone?: string;
  relationship?: string;
  fee: number;
}

export type RentalUnit = 'day' | 'week' | 'month';

export type DepositMethod = 'card-hold' | 'card-charge' | 'cash' | 'collateral' | 'none';
export type PaymentMethod = 'card-on-file' | 'ach' | 'cash' | 'zelle' | 'cashapp' | 'wire' | 'crypto' | 'other';
export type PaymentSchedule = 'upfront' | 'weekly' | 'biweekly' | 'monthly';

export type RentalStatus =
  | 'draft'
  | 'awaiting-signature'
  | 'signed'
  | 'active'
  | 'extended'
  | 'overdue'
  | 'non-return'
  | 'returned'
  | 'closed'
  | 'cancelled';

export interface ConditionSnapshot {
  at: string;
  odometer: number;
  fuelLevel: number; // 0..1 in eighths
  exteriorNotes?: string;
  interiorNotes?: string;
  damages: DamageMark[];
  photos: PhotoRef[];
  recordedBy?: string;
  renterAcknowledgedAt?: string;
}

export interface DamageMark {
  id: ID;
  zone: string; // e.g. 'front-bumper', 'driver-door'
  severity: 'scuff' | 'scratch' | 'dent' | 'crack' | 'missing' | 'other';
  note?: string;
  photo?: string;
}

export interface PhotoRef {
  id: ID;
  label: string;
  dataUrl?: string;
  url?: string;
  takenAt: string;
}

export interface Signature {
  role: 'renter' | 'dealer' | 'additional-driver';
  name: string;
  dataUrl: string; // PNG
  signedAt: string;
  ip?: string;
  userAgent?: string;
  method: 'in-person' | 'remote-link';
  consentToElectronicRecords: boolean;
}

export interface Fees {
  lateFeePerHour: number;
  lateGraceMinutes: number;
  cleaningFee: number;
  smokingFee: number;
  tollAdminFee: number;
  ticketAdminFee: number;
  fuelRefillPerEighth: number;
  additionalDriverFee: number;
  deliveryFee: number;
  earlyTerminationPolicy: 'no-refund' | 'prorated' | 'prorated-minus-fee';
  earlyTerminationFee: number;
}

export interface Rules {
  geographicLimit: 'metro' | 'state' | 'regional' | 'national' | 'custom';
  geographicNote?: string;
  radiusMiles?: number;
  trackUseProhibited: boolean;
  rideshareProhibited: boolean;
  subleaseProhibited: boolean;
  smokingProhibited: boolean;
  petsAllowed: boolean;
  gpsConsent: boolean;
  starterInterruptConsent: boolean;
  requiredFuelOctane?: number;
}

export interface RentalTerms {
  startAt: string;
  endAt: string;
  unit: RentalUnit;
  quantity: number;
  rate: number; // per unit
  includedMiles: number; // total for the rental
  overagePerMile: number;
  taxRate: number; // 0..1
  discount: number; // flat
  renewalIntent: 'none' | 'likely' | 'auto-renew';
  renewalRate?: number;
  delivery?: { enabled: boolean; address?: Address; fee: number; returnPickup: boolean };
}

export interface DepositTerms {
  required: boolean;
  amount: number;
  method: DepositMethod;
  collateralDescription?: string;
  holdReference?: string;
  releaseDaysAfterReturn: number;
  authorizedDeductions: string[];
}

export interface PaymentTerms {
  method: PaymentMethod;
  schedule: PaymentSchedule;
  downPayment: number;
  cardLast4?: string;
  cardBrand?: string;
  cardOnFileAuthorized: boolean;
  postReturnChargeWindowDays: number;
  riskAcknowledged?: boolean; // for untrackable methods
}

export interface Installment {
  id: ID;
  dueAt: string;
  amount: number;
  label: string;
  status: 'scheduled' | 'due' | 'paid' | 'partial' | 'overdue' | 'waived';
  paidAmount: number;
  paidAt?: string;
  method?: PaymentMethod;
  reference?: string;
}

export interface RentalEvent {
  id: ID;
  at: string;
  type:
    | 'created' | 'edited' | 'contract-generated' | 'sent-for-signature' | 'viewed-by-renter'
    | 'signed-renter' | 'signed-dealer' | 'checked-out' | 'payment' | 'extension'
    | 'late-notice' | 'gps-alert' | 'starter-disabled' | 'starter-enabled' | 'checked-in'
    | 'deposit-released' | 'deduction' | 'non-return-declared' | 'closed' | 'cancelled' | 'note';
  summary: string;
  meta?: Record<string, unknown>;
  by?: string;
}

export interface Deduction {
  id: ID;
  category: 'damage' | 'fuel' | 'cleaning' | 'smoking' | 'mileage' | 'toll' | 'ticket' | 'late' | 'other';
  amount: number;
  note: string;
  evidence: PhotoRef[];
  at: string;
}

export interface Rental {
  id: ID;
  number: string; // NW-2026-0001
  status: RentalStatus;
  vehicleId: ID;
  customerId: ID;
  additionalDrivers: AdditionalDriver[];
  terms: RentalTerms;
  deposit: DepositTerms;
  payment: PaymentTerms;
  fees: Fees;
  rules: Rules;
  checkout?: ConditionSnapshot;
  checkin?: ConditionSnapshot;
  contract?: { templateId: ID; version: number; html?: string; generatedAt: string; hash: string };
  signatures: Signature[];
  signingToken?: string;
  signingExpiresAt?: string;
  installments: Installment[];
  deductions: Deduction[];
  timeline: RentalEvent[];
  extensions: { at: string; newEndAt: string; addedAmount: number; note?: string }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Clause {
  id: string;
  title: string;
  body: string; // may contain {{tokens}}
  plain: string; // plain-language summary for the renter
  required: boolean;
  enabled: boolean;
  category: 'core' | 'money' | 'use' | 'damage' | 'tech' | 'legal';
}

export interface ContractTemplate {
  id: ID;
  name: string;
  version: number;
  intro: string;
  clauses: Clause[];
  signatureBlock: string;
  isDefault: boolean;
  updatedAt: string;
}

export interface CompanySettings {
  onboarded: boolean;
  legalName: string;
  dba: string;
  email: string;
  phone: string;
  address?: Address;
  lotAddress?: Address;
  timezone: string;
  taxRate: number;
  defaults: {
    minRenterAge: number;
    depositAmount: number;
    depositReleaseDays: number;
    includedMilesPerDay: number;
    overagePerMile: number;
    postReturnChargeWindowDays: number;
    fees: Fees;
    rules: Rules;
    insuranceRequirement: 'renter-policy' | 'company-cdw' | 'either';
  };
  payments: {
    acceptCard: boolean;
    acceptAch: boolean;
    acceptCash: boolean;
    acceptZelle: boolean;
    acceptCashApp: boolean;
    acceptWire: boolean;
    acceptCrypto: boolean;
    requireCardOnFile: boolean;
  };
  sounds: boolean;
  theme: 'system' | 'light' | 'dark';
  logoDataUrl?: string;
  governingState: string;
  arbitration: boolean;
}

export interface UserProfile {
  id: ID;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'agent';
  pin?: string;
}

export interface Reservation {
  id: ID;
  vehicleId?: ID;
  name: string;
  email: string;
  phone: string;
  startAt: string;
  endAt: string;
  message?: string;
  status: 'new' | 'contacted' | 'converted' | 'declined';
  createdAt: string;
}
