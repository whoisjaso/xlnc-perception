import type { Customer, Rental, Vehicle, CompanySettings } from './types';
import type { WizardDraft } from '@/store/wizard';
import { buildInstallments, computeEnd, quote } from './pricing';
import { nowIso, uid } from './util';

export function draftQuote(d: WizardDraft, v: Vehicle | undefined) {
  const endAt = computeEnd(d.startAt, d.unit, d.quantity);
  const includedMiles = d.includedMilesPerDay * (d.unit === 'day' ? 1 : d.unit === 'week' ? 7 : 30) * d.quantity;
  const terms = { startAt: d.startAt, endAt, unit: d.unit, quantity: d.quantity, rate: d.rate || (v ? v.rates[d.unit === 'day' ? 'daily' : d.unit === 'week' ? 'weekly' : 'monthly'] : 0), includedMiles, overagePerMile: d.overagePerMile, taxRate: 0, discount: d.discount, renewalIntent: d.renewalIntent, renewalRate: d.renewalRate || undefined, delivery: { enabled: !!d.deliveryEnabled, address: d.deliveryAddress, fee: d.deliveryFee, returnPickup: d.returnPickup } };
  return { terms, endAt, includedMiles };
}

export function buildRentalFromDraft(args: { draft: WizardDraft; vehicle: Vehicle; customer: Customer; settings: CompanySettings; number: string; templateId: string }): Rental {
  const { draft: d, vehicle, customer, settings, number } = args;
  const { terms } = draftQuote(d, vehicle);
  terms.taxRate = settings.taxRate;
  const q = quote({ terms, additionalDriverCount: d.additionalDrivers.length, additionalDriverFee: d.fees.additionalDriverFee, depositAmount: d.depositRequired ? d.depositAmount : 0, downPayment: d.downPayment, schedule: d.schedule });
  const installments = buildInstallments({ terms, total: q.total, downPayment: d.downPayment, schedule: d.schedule });
  const now = nowIso();
  return {
    id: d.rentalId ?? uid('rnt'),
    number,
    status: 'draft',
    vehicleId: vehicle.id,
    customerId: customer.id,
    additionalDrivers: d.additionalDrivers,
    terms,
    deposit: { required: !!d.depositRequired, amount: d.depositRequired ? d.depositAmount : 0, method: d.depositRequired ? d.depositMethod : 'none', collateralDescription: d.collateralDescription || undefined, releaseDaysAfterReturn: settings.defaults.depositReleaseDays, authorizedDeductions: ['damage', 'fuel', 'cleaning', 'smoking', 'mileage', 'toll', 'ticket', 'late'] },
    payment: { method: d.paymentMethod, schedule: d.schedule, downPayment: d.downPayment, cardLast4: d.cardLast4 || undefined, cardBrand: d.cardBrand || undefined, cardOnFileAuthorized: d.cardOnFileAuthorized, postReturnChargeWindowDays: settings.defaults.postReturnChargeWindowDays, riskAcknowledged: d.riskAcknowledged },
    fees: d.fees,
    rules: d.rules,
    checkout: { at: now, odometer: d.odometerOut ?? vehicle.odometer, fuelLevel: d.fuelOut, damages: d.damages, photos: d.photos, exteriorNotes: d.conditionNotes },
    contract: { templateId: args.templateId, version: 1, generatedAt: now, hash: '' },
    signatures: [],
    installments,
    deductions: [],
    timeline: [{ id: uid('ev'), at: now, type: 'created', summary: `Rental drafted for ${vehicle.year} ${vehicle.make} ${vehicle.model}` }],
    extensions: [],
    createdAt: now,
    updatedAt: now,
  };
}
