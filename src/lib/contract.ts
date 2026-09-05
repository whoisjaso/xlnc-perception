import { format } from 'date-fns';
import type { Clause, CompanySettings, ContractTemplate, Customer, Rental, Vehicle } from './types';
import { money, fullName, num } from './util';
import { formatAddress } from './address';
import { quote as computeQuote } from './pricing';

export interface ContractContext {
  rental: Rental;
  vehicle: Vehicle;
  customer: Customer;
  company: CompanySettings;
  template: ContractTemplate;
}

const fmtDate = (iso: string) => (iso ? format(new Date(iso), "MMMM d, yyyy 'at' h:mm a") : '');
const fmtDay = (iso: string) => (iso ? format(new Date(iso), 'MMMM d, yyyy') : '');
const fuelText = (level: number) => {
  const e = Math.round(level * 8);
  if (e >= 8) return 'Full';
  if (e === 0) return 'Empty';
  return `${e}/8`;
};
const mask = (s?: string) => (s ? `${'•'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}` : '');

export function buildTokens(ctx: ContractContext): Record<string, string> {
  const { rental: r, vehicle: v, customer: c, company } = ctx;
  const q = computeQuote({
    terms: r.terms,
    additionalDriverCount: r.additionalDrivers.length,
    additionalDriverFee: r.fees.additionalDriverFee,
    depositAmount: r.deposit.required ? r.deposit.amount : 0,
    downPayment: r.payment.downPayment,
    schedule: r.payment.schedule,
  });
  const unitLabel = r.terms.unit;
  const unitPlural = r.terms.quantity === 1 ? unitLabel : `${unitLabel}s`;
  const methodLabels: Record<string, string> = { 'card-on-file': `card on file (${r.payment.cardBrand ?? 'card'} ending ${r.payment.cardLast4 ?? '••••'})`, ach: 'bank transfer (ACH)', cash: 'cash', zelle: 'Zelle', cashapp: 'Cash App', wire: 'wire transfer', crypto: 'cryptocurrency', other: 'other method' };
  const depositMethods: Record<string, string> = { 'card-hold': 'pre-authorization hold on the card on file', 'card-charge': 'charge to the card on file, refundable', cash: 'cash deposit', collateral: `collateral (${r.deposit.collateralDescription ?? 'as described'})`, none: 'no deposit' };
  const scheduleText = r.installments.length
    ? r.installments.map((i) => `${money(i.amount, { cents: true })} due ${fmtDay(i.dueAt)}`).join('; ')
    : r.payment.schedule === 'upfront' ? 'paid in full at signing' : `${r.payment.schedule} installments`;
  const scheduleShort = r.payment.schedule === 'upfront' ? 'nothing further' : `${r.payment.schedule} payments`;
  const extras: string[] = [];
  if (q.deliveryFee) extras.push(`Delivery ${money(q.deliveryFee)}`);
  if (q.additionalDrivers) extras.push(`Additional drivers ${money(q.additionalDrivers)}`);
  if (q.discount) extras.push(`Discount (${money(q.discount)})`);
  const geo: Record<string, string> = { metro: `the ${company.address?.city ?? 'metro'} metropolitan area`, state: `the State of ${company.governingState}`, regional: `the states adjoining ${company.governingState}`, national: 'the continental United States', custom: r.rules.geographicNote ?? `a ${r.rules.radiusMiles ?? 250} mile radius of the pickup location` };
  const ins = c.insurance ?? { mode: 'renter-policy' as const };
  const insuranceClause = ins.mode === 'company-cdw'
    ? `Renter has elected Owner's Collision Damage Waiver. Subject to the exclusions in this Agreement, Renter's responsibility for physical damage to the Vehicle is limited to a deductible of ${money(Math.min(r.deposit.amount || 5000, 5000))} per incident. The waiver is void on any prohibited use, any unauthorized driver, or any misrepresentation.`
    : `Renter carries a personal automobile insurance policy with ${ins.carrier ?? 'the carrier named in the file'} (policy ${ins.policyNumber ?? 'on file'}, limits ${ins.liabilityLimits ?? 'as stated on the declarations page'}) that Renter represents extends primary comprehensive, collision, and liability coverage to rental vehicles. Renter's policy is primary; Owner's coverage, if any, is excess.${ins.mode === 'both' ? ' Renter has additionally purchased Owner\'s Collision Damage Waiver, which reduces Renter\'s out-of-pocket responsibility to the stated deductible after Renter\'s own policy responds.' : ''}`;
  const insurancePlain = ins.mode === 'company-cdw' ? `You took our damage waiver: your maximum for damage is ${money(Math.min(r.deposit.amount || 5000, 5000))} unless you break the rules.` : `Your own ${ins.carrier ?? ''} policy covers this car first.`;
  const early = r.fees.earlyTerminationPolicy === 'no-refund' ? 'not refundable' : r.fees.earlyTerminationPolicy === 'prorated' ? 'refunded pro rata for full unused days' : `refunded pro rata for full unused days less a ${money(r.fees.earlyTerminationFee)} fee`;
  const d = r.terms.delivery;
  const deliveryText = d?.enabled
    ? `Owner will deliver the Vehicle to ${formatAddress(d.address)} for a delivery fee of ${money(d.fee)}${d.returnPickup ? ` and collect it from the same address at the Return Time for an additional ${money(d.fee)}` : ''}. Renter or a listed Additional Driver must be present with identification at delivery. Waiting time beyond 20 minutes is billed at $50 per 15 minutes.`
    : `Renter collects and returns the Vehicle at Owner's location, ${formatAddress(company.lotAddress ?? company.address) || 'as directed by Owner'}.`;
  const deliveryPlain = d?.enabled ? `We deliver to ${d.address?.line1 ?? 'your address'} (${money(d.fee)})${d.returnPickup ? ' and pick it up' : ''}.` : 'Pickup and return at our lot.';

  return {
    'contract.date': fmtDay(r.contract?.generatedAt ?? new Date().toISOString()),
    'contract.number': r.number,
    'company.legalName': company.legalName,
    'company.dbaSuffix': company.dba && company.dba !== company.legalName ? ` d/b/a ${company.dba}` : '',
    'company.dba': company.dba || company.legalName,
    'company.governingState': stateName(company.governingState),
    'company.phone': company.phone,
    'company.email': company.email,
    'renter.fullName': fullName(c),
    'renter.address': formatAddress(c.address) || 'address on file',
    'renter.licenseMasked': mask(c.license?.number),
    'renter.licenseState': c.license?.state ?? '',
    'renter.dob': c.dateOfBirth ? fmtDay(c.dateOfBirth + 'T12:00:00') : '',
    'renter.email': c.email,
    'renter.phone': c.phone,
    'vehicle.year': String(v.year),
    'vehicle.make': v.make,
    'vehicle.model': v.model,
    'vehicle.trimSuffix': v.trim ? ` ${v.trim}` : '',
    'vehicle.color': v.color,
    'vehicle.vin': v.vin,
    'vehicle.plate': [v.plate, v.plateState].filter(Boolean).join(' ') || 'on file',
    'vehicle.includedMilesPerDay': num(v.includedMilesPerDay),
    'terms.start': fmtDate(r.terms.startAt),
    'terms.end': fmtDate(r.terms.endAt),
    'terms.returnLocation': d?.enabled && d.returnPickup ? formatAddress(d.address) : formatAddress(company.lotAddress ?? company.address) || "Owner's location",
    'terms.unitLabel': unitLabel,
    'terms.unitPlural': unitPlural,
    'terms.quantity': String(r.terms.quantity),
    'terms.rate': money(r.terms.rate),
    'terms.renewalRate': money(r.terms.renewalRate ?? r.terms.rate),
    'terms.includedMiles': num(r.terms.includedMiles),
    'terms.overagePerMile': money(r.terms.overagePerMile, { cents: true }),
    'terms.minAge': String(v.minRenterAge || company.defaults.minRenterAge),
    'quote.base': money(q.base),
    'quote.tax': money(q.tax, { cents: true }),
    'quote.total': money(q.total, { cents: true }),
    'quote.extrasLine': extras.length ? extras.join('. ') + '. ' : '',
    'payment.downPayment': money(r.payment.downPayment, { cents: true }),
    'payment.scheduleText': scheduleText,
    'payment.scheduleShort': scheduleShort,
    'payment.methodLabel': methodLabels[r.payment.method] ?? r.payment.method,
    'payment.cardLast4': r.payment.cardLast4 ?? '••••',
    'payment.postReturnWindow': String(r.payment.postReturnChargeWindowDays),
    'deposit.amount': money(r.deposit.amount),
    'deposit.methodLabel': depositMethods[r.deposit.method] ?? r.deposit.method,
    'deposit.releaseDays': String(r.deposit.releaseDaysAfterReturn),
    'checkout.odometer': r.checkout ? `${num(r.checkout.odometer)} mi` : 'to be recorded at delivery',
    'checkout.fuel': r.checkout ? fuelText(r.checkout.fuelLevel) : 'Full',
    'checkout.damageList': r.checkout?.damages.length ? r.checkout.damages.map((x) => `${x.zone.replace(/-/g, ' ')} (${x.severity}${x.note ? `: ${x.note}` : ''})`).join('; ') : 'none',
    'fees.lateGrace': String(r.fees.lateGraceMinutes),
    'fees.lateFeePerHour': money(r.fees.lateFeePerHour),
    'fees.fuelPerEighth': money(r.fees.fuelRefillPerEighth),
    'fees.smokingFee': money(r.fees.smokingFee),
    'fees.cleaningFee': money(r.fees.cleaningFee),
    'fees.tollAdminFee': money(r.fees.tollAdminFee),
    'fees.ticketAdminFee': money(r.fees.ticketAdminFee),
    'fees.earlyTerminationText': early,
    'rules.geoText': geo[r.rules.geographicLimit] ?? geo.state,
    'rules.octaneClause': r.rules.requiredFuelOctane ? ` using ${r.rules.requiredFuelOctane} octane or higher` : '',
    'rules.petsText': r.rules.petsAllowed ? 'Pets are permitted in a carrier or on a seat cover; hair, odor, or damage is charged as cleaning or damage.' : 'No animals are permitted in the Vehicle other than service animals as required by law.',
    'rules.petsPlain': r.rules.petsAllowed ? 'Pets OK in a carrier.' : 'No pets.',
    'rules.starterInterruptText': r.rules.starterInterruptConsent ? 'a starter-interrupt device that allows Owner to prevent the Vehicle from starting (never while in motion) in the event of non-payment, prohibited use, geofence violation, or suspected theft' : 'no remote disable device',
    'rules.starterInterruptPlain': r.rules.starterInterruptConsent ? 'we can stop it from starting if the contract is broken' : 'there is no remote shut-off',
    'insurance.clause': insuranceClause,
    'insurance.plain': insurancePlain,
    'delivery.text': deliveryText,
    'delivery.plain': deliveryPlain,
    'legal.arbitration': company.arbitration ? 'Any dispute arising from this Agreement will be resolved by binding individual arbitration under the Federal Arbitration Act, administered by the American Arbitration Association, and Renter waives any right to a jury trial or to participate in a class action. Either party may bring an individual claim in small claims court.' : 'The parties consent to the exclusive jurisdiction of the state and federal courts located in the county of Owner\'s principal place of business.',
    'legal.arbitrationPlain': company.arbitration ? 'Disputes go to arbitration, not a class action.' : 'Disputes go to local court.',
  };
}

export function fill(text: string, tokens: Record<string, string>) {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k: string) => tokens[k] ?? '');
}

export function activeClauses(template: ContractTemplate, rental: Rental): Clause[] {
  return template.clauses.filter((c) => {
    if (!c.enabled) return false;
    if (c.id === 'deposit' && !rental.deposit.required) return false;
    if (c.id === 'gps' && !rental.rules.gpsConsent) return false;
    if (c.id === 'card-on-file' && rental.payment.method !== 'card-on-file' && !rental.payment.cardOnFileAuthorized) return false;
    return true;
  });
}

export function renderContractHtml(ctx: ContractContext): string {
  const tokens = buildTokens(ctx);
  const clauses = activeClauses(ctx.template, ctx.rental);
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const parts = clauses.map(
    (c, i) => `<section class="clause"><h3>${i + 1}. ${esc(c.title)}</h3><p>${esc(fill(c.body, tokens))}</p><p class="plain"><strong>In plain terms:</strong> ${esc(fill(c.plain, tokens))}</p></section>`,
  );
  const sigs = ctx.rental.signatures.map((s) => `<div class="sig"><div class="sig-line">${s.dataUrl ? `<img src="${s.dataUrl}" alt="Signature of ${esc(s.name)}" />` : ''}</div><div class="sig-meta">${esc(s.name)} (${s.role === 'dealer' ? 'Owner' : s.role === 'renter' ? 'Renter' : 'Additional driver'}) signed ${fmtDate(s.signedAt)} via ${s.method === 'remote-link' ? 'remote signing link' : 'in person'}${s.ip ? `, IP ${esc(s.ip)}` : ''}</div></div>`).join('');
  return `<article class="contract"><header><p class="co">${esc(tokens['company.dba'])}</p><h1>Vehicle Rental Agreement</h1><p class="meta">Agreement ${esc(ctx.rental.number)} · ${esc(tokens['contract.date'])}</p><p class="intro">${esc(ctx.template.intro)}</p></header>${parts.join('')}<section class="clause"><h3>Signatures</h3><p>${esc(ctx.template.signatureBlock)}</p>${sigs || '<p class="plain">Awaiting signatures.</p>'}</section></article>`;
}

export function renderContractText(ctx: ContractContext): string {
  const tokens = buildTokens(ctx);
  return activeClauses(ctx.template, ctx.rental).map((c, i) => `${i + 1}. ${c.title}\n${fill(c.body, tokens)}`).join('\n\n');
}

const STATE_NAMES: Record<string, string> = { TX: 'Texas', CA: 'California', FL: 'Florida', NY: 'New York', GA: 'Georgia', NV: 'Nevada', AZ: 'Arizona', IL: 'Illinois', NJ: 'New Jersey', CO: 'Colorado', WA: 'Washington', NC: 'North Carolina', TN: 'Tennessee', PA: 'Pennsylvania', MA: 'Massachusetts', OH: 'Ohio', MI: 'Michigan', VA: 'Virginia', MD: 'Maryland', UT: 'Utah', OR: 'Oregon', LA: 'Louisiana', OK: 'Oklahoma', SC: 'South Carolina', MN: 'Minnesota', MO: 'Missouri', WI: 'Wisconsin', IN: 'Indiana', AL: 'Alabama', KY: 'Kentucky', DC: 'District of Columbia' };
export const stateName = (abbr: string) => STATE_NAMES[abbr] ?? abbr;
