import type { Clause, ContractTemplate } from '@/lib/types';

// Tokens are resolved by lib/contract.ts. Dealer-side positioning is deliberate:
// each clause is written to be recoverable in a chargeback or small-claims setting,
// and each carries a plain-language line so the renter can never say they were not told.
export const DEFAULT_CLAUSES: Clause[] = [
  {
    id: 'parties',
    category: 'core',
    title: 'Parties and Vehicle',
    required: true,
    enabled: true,
    body:
      'This Vehicle Rental Agreement (the "Agreement") is made on {{contract.date}} between {{company.legalName}}{{company.dbaSuffix}} ("Owner") and {{renter.fullName}} ("Renter"), residing at {{renter.address}}, driver license {{renter.licenseMasked}} ({{renter.licenseState}}), date of birth {{renter.dob}}. Owner rents to Renter the {{vehicle.year}} {{vehicle.make}} {{vehicle.model}}{{vehicle.trimSuffix}}, {{vehicle.color}}, VIN {{vehicle.vin}}, plate {{vehicle.plate}} (the "Vehicle"). Renter represents that the identity, license, insurance, and payment card presented are genuine and belong to Renter, and that Renter is at least {{terms.minAge}} years of age.',
    plain: 'Who is renting what. You confirm your ID, license, insurance, and card are yours.',
  },
  {
    id: 'term',
    category: 'core',
    title: 'Rental Period and Return',
    required: true,
    enabled: true,
    body:
      'The rental period begins {{terms.start}} and ends {{terms.end}} (the "Return Time"). The Vehicle must be returned to {{terms.returnLocation}} at or before the Return Time in the same condition as delivered, ordinary wear excepted. A grace period of {{fees.lateGrace}} minutes applies. After the grace period, a late charge of {{fees.lateFeePerHour}} per hour applies; more than six (6) hours late is billed as a full additional {{terms.unitLabel}} at {{terms.rate}}. If the Vehicle is not returned within twenty-four (24) hours after the Return Time and Renter has not obtained a written extension, Renter agrees that continued possession constitutes unauthorized use and conversion, that Owner may report the Vehicle stolen, and that Owner may recover the Vehicle by any lawful means at Renter\'s expense.',
    plain: 'Return on time to the lot. Late costs {{fees.lateFeePerHour}}/hr after {{fees.lateGrace}} minutes. 24 hours late with no extension is treated as theft.',
  },
  {
    id: 'rate',
    category: 'money',
    title: 'Rate, Charges, and Payment',
    required: true,
    enabled: true,
    body:
      'The rental rate is {{terms.rate}} per {{terms.unitLabel}} for {{terms.quantity}} {{terms.unitPlural}}, for a base charge of {{quote.base}}. {{quote.extrasLine}}Taxes of {{quote.tax}} apply. The total rental charge is {{quote.total}}. Renter pays {{payment.downPayment}} at signing and the balance according to the following schedule: {{payment.scheduleText}}. Payment is by {{payment.methodLabel}}. Any payment not received within 24 hours of its due date places the Agreement in default; Owner may then suspend Renter\'s right to use the Vehicle, remotely disable the Vehicle where so equipped, and demand immediate return.',
    plain: '{{terms.rate}} per {{terms.unitLabel}}. Total {{quote.total}}. {{payment.downPayment}} due today, then {{payment.scheduleShort}}. Missing a payment by more than a day puts the rental in default.',
  },
  {
    id: 'card-on-file',
    category: 'money',
    title: 'Card on File Authorization',
    required: true,
    enabled: true,
    body:
      'Renter authorizes Owner to keep the payment card ending in {{payment.cardLast4}} on file and to charge it for: rental charges and installments as they come due; extension charges; the security deposit; and any amounts owed under this Agreement including mileage overage, fuel, cleaning, smoking, tolls, citations, impound, towing, late charges, damage up to the amount specified in Section "Damage and Loss," and administrative fees. This authorization survives the return of the Vehicle and remains in effect for {{payment.postReturnWindow}} days after return, or until all amounts are paid, whichever is later. Renter agrees not to dispute charges made under this Agreement with the card issuer and agrees that this signed Agreement, the check-out and check-in photographs, and the itemized statement constitute proof of the charge.',
    plain: 'We keep your card on file and can charge it for anything owed under this contract, including for {{payment.postReturnWindow}} days after you return the car (tolls and tickets arrive late).',
  },
  {
    id: 'deposit',
    category: 'money',
    title: 'Security Deposit',
    required: false,
    enabled: true,
    body:
      'A security deposit of {{deposit.amount}} is collected as a {{deposit.methodLabel}}. The deposit is not a limit on Renter\'s liability. Owner may apply the deposit toward any amount owed and will provide an itemized statement with supporting photographs for any deduction. Any unused deposit is released within {{deposit.releaseDays}} business days after the Vehicle is returned and inspected. Card holds are released by the issuing bank on its own timeline, typically five to ten business days after Owner releases the hold.',
    plain: 'Deposit: {{deposit.amount}} ({{deposit.methodLabel}}). Refunded within {{deposit.releaseDays}} business days after return, minus anything itemized with photos. Your bank may take longer to show it.',
  },
  {
    id: 'mileage',
    category: 'money',
    title: 'Mileage',
    required: true,
    enabled: true,
    body:
      'The rental includes {{terms.includedMiles}} miles in total ({{vehicle.includedMilesPerDay}} per day). Odometer at check-out: {{checkout.odometer}}. Miles driven beyond the included allowance are charged at {{terms.overagePerMile}} per mile. Odometer tampering or disconnection is a material breach and is billed at 500 miles per day of the rental period at the overage rate.',
    plain: '{{terms.includedMiles}} miles included. {{terms.overagePerMile}} for each mile over.',
  },
  {
    id: 'fuel',
    category: 'money',
    title: 'Fuel',
    required: true,
    enabled: true,
    body:
      'The Vehicle is delivered with fuel at {{checkout.fuel}} and must be returned at the same level{{rules.octaneClause}}. Fuel shortfall is charged at {{fees.fuelPerEighth}} per one-eighth tank, plus a refueling service fee of $25. Evidence of incorrect fuel grade or contamination makes Renter liable for all resulting repair and loss-of-use.',
    plain: 'Return it with the same fuel level{{rules.octaneClause}}. Shortfall: {{fees.fuelPerEighth}} per eighth tank plus $25.',
  },
  {
    id: 'condition',
    category: 'damage',
    title: 'Condition at Check-Out and Inspection',
    required: true,
    enabled: true,
    body:
      'Owner and Renter completed a joint walk-around before delivery. Timestamped photographs and video were taken and are incorporated into this Agreement. Pre-existing conditions noted: {{checkout.damageList}}. Renter acknowledges that any damage not noted at check-out and present at check-in is presumed to have occurred during the rental period. Renter agrees to photograph the Vehicle at return and acknowledges that Owner\'s check-in inspection may occur up to twenty-four (24) hours after return.',
    plain: 'We photographed the car together at pickup. Anything new at return is on you. Photograph it when you return it.',
  },
  {
    id: 'damage',
    category: 'damage',
    title: 'Damage and Loss',
    required: true,
    enabled: true,
    body:
      'Renter is responsible for all loss of or damage to the Vehicle during the rental period regardless of fault, including theft, vandalism, weather, road hazards, wheel and tire damage, curb rash, front splitter and underbody damage, glass, interior stains, burns, and odors, up to the full value of the Vehicle. Renter is further liable for: (a) reasonable repair cost or actual cash value, whichever is less; (b) loss of use calculated at the daily rate for each day the Vehicle is out of service, without regard to fleet utilization; (c) diminished value; (d) towing, storage, and appraisal; and (e) an administrative fee of $250. Where Renter\'s insurance responds, Renter assigns to Owner all rights to insurance proceeds and remains liable for any deductible and shortfall. Renter agrees that the Vehicle\'s condition photographs, an independent estimate, and Owner\'s itemized statement are sufficient evidence of the amount owed.',
    plain: 'If it gets damaged or stolen on your watch, you pay for the repair, the days it is off the road, lost value, towing, and a $250 admin fee. Your insurance may cover some of it; the rest is yours.',
  },
  {
    id: 'insurance',
    category: 'damage',
    title: 'Insurance',
    required: true,
    enabled: true,
    body:
      '{{insurance.clause}} Renter must report any accident, theft, or loss to Owner within two (2) hours and to police within twenty-four (24) hours, and must provide a written statement and any police report number. Renter must not admit fault or negotiate any claim on Owner\'s behalf.',
    plain: '{{insurance.plain}} Call us within 2 hours of any incident and police within 24.',
  },
  {
    id: 'use',
    category: 'use',
    title: 'Permitted and Prohibited Use',
    required: true,
    enabled: true,
    body:
      'Only Renter and the Additional Drivers listed in this Agreement may drive the Vehicle. The Vehicle must not be used: (a) for racing, timed events, track days, drifting, burnouts, launch-control abuse, or any contest of speed; (b) for rideshare, delivery, livery, courier, or any commercial purpose; (c) to sublease, lend, or transfer possession to any third party; (d) on unpaved roads, off-road, beaches, or through standing water; (e) to tow or push anything; (f) while the driver is impaired by alcohol, cannabis, or any drug; (g) to transport persons or property for hire; (h) outside {{rules.geoText}}; (i) with any driving-aid or stability system disabled; or (j) for any illegal purpose. Any prohibited use voids all coverage, makes Renter liable for the full value of the Vehicle, and is billed at an additional $500 per day of the rental period. Unauthorized drivers are billed at $400 per day.',
    plain: 'Only the drivers on this contract. No track use, no rideshare, no lending it out, no leaving {{rules.geoText}}. Breaking these voids coverage and costs $500/day.',
  },
  {
    id: 'smoking',
    category: 'use',
    title: 'Smoking, Pets, and Cleaning',
    required: false,
    enabled: true,
    body:
      'The Vehicle is a non-smoking, non-vaping vehicle. Evidence of smoking or vaping (odor, ash, burns, residue) is charged at {{fees.smokingFee}} plus detailing and loss of use. {{rules.petsText}} A cleaning fee of {{fees.cleaningFee}} applies if the Vehicle is returned with excessive dirt, sand, stains, spills, trash, or odor.',
    plain: 'No smoking or vaping ({{fees.smokingFee}}). {{rules.petsPlain}} Excessive mess: {{fees.cleaningFee}}.',
  },
  {
    id: 'tolls',
    category: 'money',
    title: 'Tolls, Citations, and Impound',
    required: true,
    enabled: true,
    body:
      'Renter is responsible for all tolls, parking tickets, red-light and speed camera citations, moving violations, and impound or towing charges incurred during the rental period, whenever notice is received by Owner. Owner will charge the card on file for the amount of each item plus an administrative fee of {{fees.tollAdminFee}} per toll event and {{fees.ticketAdminFee}} per citation, and may identify Renter as the driver to the issuing authority.',
    plain: 'Tolls and tickets are yours, even if they arrive months later, plus {{fees.tollAdminFee}}/toll and {{fees.ticketAdminFee}}/ticket admin fee.',
  },
  {
    id: 'gps',
    category: 'tech',
    title: 'GPS Tracking and Remote Disable',
    required: false,
    enabled: true,
    body:
      'Renter acknowledges and consents that the Vehicle is equipped with a GPS telematics device that records location, speed, and trip data at all times, and {{rules.starterInterruptText}}. Owner may use this data to enforce this Agreement, locate the Vehicle, respond to theft or non-return, and document prohibited use. Owner will not use GPS data to assess speed-based surcharges where prohibited by law. Tampering with or disabling any device is a material breach billed at $1,500 plus repair.',
    plain: 'The car has GPS. We can see where it is and how it is driven, and {{rules.starterInterruptPlain}}. Tampering with it costs $1,500.',
  },
  {
    id: 'extension',
    category: 'core',
    title: 'Extensions and Early Return',
    required: true,
    enabled: true,
    body:
      'Extensions require Owner\'s written approval before the Return Time and are billed in advance at {{terms.renewalRate}} per {{terms.unitLabel}}. Verbal or text requests are not extensions until Owner confirms in writing and payment is received. Early return is {{fees.earlyTerminationText}}.',
    plain: 'Want more time? Ask before the return time, in writing, and prepay. Early return: {{fees.earlyTerminationText}}.',
  },
  {
    id: 'delivery',
    category: 'core',
    title: 'Delivery and Collection',
    required: false,
    enabled: true,
    body:
      '{{delivery.text}}',
    plain: '{{delivery.plain}}',
  },
  {
    id: 'default',
    category: 'legal',
    title: 'Default and Recovery',
    required: true,
    enabled: true,
    body:
      'Renter is in default if any payment is late, any representation is false, any prohibited use occurs, the Vehicle is not returned as agreed, or Renter becomes unreachable for more than 24 hours. On default, Owner may terminate this Agreement, remotely disable and repossess the Vehicle wherever located without notice, charge all amounts owed to the card on file, and recover all costs of collection including recovery agents, towing, storage, and reasonable attorney fees. Renter waives any claim for personal property left in the Vehicle.',
    plain: 'If you break the contract, we can shut the car off, take it back, charge your card, and bill you for the cost of getting it back.',
  },
  {
    id: 'electronic',
    category: 'legal',
    title: 'Electronic Records and Signatures',
    required: true,
    enabled: true,
    body:
      'Renter consents to conduct this transaction electronically and agrees that electronic signatures, photographs, and records have the same force as originals under the U.S. Electronic Signatures in Global and National Commerce Act and applicable state law. A copy of this Agreement will be delivered to Renter\'s email address {{renter.email}}.',
    plain: 'Signing on a screen counts. You will get a copy by email.',
  },
  {
    id: 'law',
    category: 'legal',
    title: 'Governing Law and Disputes',
    required: true,
    enabled: true,
    body:
      'This Agreement is governed by the laws of the State of {{company.governingState}}. {{legal.arbitration}} If any provision is unenforceable, the remainder stays in effect. This Agreement, with its incorporated photographs and schedules, is the entire agreement and may only be modified in writing signed by Owner.',
    plain: '{{company.governingState}} law applies. {{legal.arbitrationPlain}}',
  },
];

export const DEFAULT_TEMPLATE: ContractTemplate = {
  id: 'tpl_default',
  name: 'Standard Exotic Rental Agreement',
  version: 1,
  intro:
    'Read every section. Initial the money sections. Sign at the end. This Agreement protects the Vehicle, and it protects you by putting every charge in writing before you drive.',
  clauses: DEFAULT_CLAUSES,
  signatureBlock:
    'By signing, Renter confirms they have read and understood every section of this Agreement, received the plain-language summary of each section, participated in the check-out inspection, and authorizes the charges described.',
  isDefault: true,
  updatedAt: new Date('2026-01-01').toISOString(),
};
