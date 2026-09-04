import type { Fees, Installment, PaymentSchedule, RentalTerms, RentalUnit } from './types';
import { addDays, addMonths, addWeeks, differenceInMinutes } from 'date-fns';
import { uid } from './util';

export const UNIT_DAYS: Record<RentalUnit, number> = { day: 1, week: 7, month: 30 };

export function computeEnd(startAt: string, unit: RentalUnit, quantity: number): string {
  const s = new Date(startAt);
  if (Number.isNaN(s.getTime())) return startAt;
  const q = Math.max(1, Math.round(quantity));
  const e = unit === 'day' ? addDays(s, q) : unit === 'week' ? addWeeks(s, q) : addMonths(s, q);
  return e.toISOString();
}

export function rentalDays(terms: Pick<RentalTerms, 'unit' | 'quantity'>) {
  return UNIT_DAYS[terms.unit] * Math.max(1, terms.quantity);
}

export interface Quote {
  base: number;
  deliveryFee: number;
  additionalDrivers: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
  deposit: number;
  dueToday: number;
  balance: number;
  days: number;
  includedMiles: number;
}

export function quote(args: {
  terms: RentalTerms;
  additionalDriverCount: number;
  additionalDriverFee: number;
  depositAmount: number;
  downPayment: number;
  schedule: PaymentSchedule;
}): Quote {
  const { terms } = args;
  const base = terms.rate * Math.max(1, terms.quantity);
  const deliveryFee = terms.delivery?.enabled ? terms.delivery.fee * (terms.delivery.returnPickup ? 2 : 1) : 0;
  const additionalDrivers = args.additionalDriverCount * args.additionalDriverFee;
  const discount = Math.min(args.terms.discount || 0, base);
  const subtotal = Math.max(0, base + deliveryFee + additionalDrivers - discount);
  const tax = Math.round(subtotal * (terms.taxRate || 0) * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const deposit = args.depositAmount || 0;
  const firstInstallment = args.schedule === 'upfront' ? total : installmentAmount(total, terms, args.schedule);
  const dueToday = Math.round((Math.max(args.downPayment, firstInstallment) + deposit) * 100) / 100;
  const balance = Math.max(0, Math.round((total - Math.max(args.downPayment, firstInstallment)) * 100) / 100);
  return { base, deliveryFee, additionalDrivers, discount, subtotal, tax, total, deposit, dueToday, balance, days: rentalDays(terms), includedMiles: terms.includedMiles };
}

function installmentAmount(total: number, terms: RentalTerms, schedule: PaymentSchedule) {
  const days = rentalDays(terms);
  const periods = schedule === 'weekly' ? Math.ceil(days / 7) : schedule === 'biweekly' ? Math.ceil(days / 14) : Math.ceil(days / 30);
  return Math.round((total / Math.max(1, periods)) * 100) / 100;
}

export function buildInstallments(args: { terms: RentalTerms; total: number; downPayment: number; schedule: PaymentSchedule }): Installment[] {
  const { terms, total, schedule } = args;
  const start = new Date(terms.startAt);
  const out: Installment[] = [];
  if (schedule === 'upfront') {
    out.push({ id: uid('inst'), dueAt: start.toISOString(), amount: total, label: 'Full rental payment', status: 'due', paidAmount: 0 });
    return out;
  }
  const days = rentalDays(terms);
  const stepDays = schedule === 'weekly' ? 7 : schedule === 'biweekly' ? 14 : 30;
  const periods = Math.max(1, Math.ceil(days / stepDays));
  const perPeriod = Math.round((total / periods) * 100) / 100;
  let remaining = total;
  for (let i = 0; i < periods; i++) {
    const due = addDays(start, i * stepDays);
    const amount = i === periods - 1 ? Math.round(remaining * 100) / 100 : perPeriod;
    remaining -= amount;
    out.push({
      id: uid('inst'),
      dueAt: due.toISOString(),
      amount,
      label: i === 0 ? 'First payment (at pickup)' : `Payment ${i + 1} of ${periods}`,
      status: i === 0 ? 'due' : 'scheduled',
      paidAmount: 0,
    });
  }
  // Down payment larger than first installment reduces the tail.
  if (args.downPayment > out[0].amount) {
    let extra = Math.round((args.downPayment - out[0].amount) * 100) / 100;
    out[0].amount = args.downPayment;
    for (let i = out.length - 1; i > 0 && extra > 0; i--) {
      const take = Math.min(extra, out[i].amount);
      out[i].amount = Math.round((out[i].amount - take) * 100) / 100;
      extra -= take;
    }
  }
  return out.filter((i) => i.amount > 0);
}

export function lateCharge(endAt: string, returnedAt: string, fees: Fees, dailyRate: number) {
  const minutes = differenceInMinutes(new Date(returnedAt), new Date(endAt));
  if (minutes <= fees.lateGraceMinutes) return { hours: 0, amount: 0, extraDays: 0 };
  const hours = Math.ceil((minutes - fees.lateGraceMinutes) / 60);
  if (hours > 6) {
    const extraDays = Math.ceil(hours / 24);
    return { hours, amount: extraDays * dailyRate, extraDays };
  }
  return { hours, amount: hours * fees.lateFeePerHour, extraDays: 0 };
}

export function mileageOverage(odoOut: number, odoIn: number, included: number, perMile: number) {
  const driven = Math.max(0, odoIn - odoOut);
  const over = Math.max(0, driven - included);
  return { driven, over, amount: Math.round(over * perMile * 100) / 100 };
}

export function fuelCharge(levelOut: number, levelIn: number, perEighth: number) {
  const eighthsShort = Math.max(0, Math.round((levelOut - levelIn) * 8));
  return { eighthsShort, amount: eighthsShort * perEighth };
}
