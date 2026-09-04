import type { CompanySettings, Customer, Fees, Rental, Rules, Vehicle } from '@/lib/types';
import { uid } from '@/lib/util';

const t = (d: string) => new Date(d).toISOString();

export const DEFAULT_FEES: Fees = {
  lateFeePerHour: 100,
  lateGraceMinutes: 60,
  cleaningFee: 350,
  smokingFee: 500,
  tollAdminFee: 15,
  ticketAdminFee: 50,
  fuelRefillPerEighth: 35,
  additionalDriverFee: 250,
  deliveryFee: 150,
  earlyTerminationPolicy: 'no-refund',
  earlyTerminationFee: 0,
};

export const DEFAULT_RULES: Rules = {
  geographicLimit: 'state',
  radiusMiles: 250,
  trackUseProhibited: true,
  rideshareProhibited: true,
  subleaseProhibited: true,
  smokingProhibited: true,
  petsAllowed: false,
  gpsConsent: true,
  starterInterruptConsent: true,
  requiredFuelOctane: 93,
};

export const DEFAULT_SETTINGS: CompanySettings = {
  onboarded: false,
  legalName: 'Nova Wheels LLC',
  dba: 'Nova Wheels',
  email: 'concierge@novawheels.com',
  phone: '(713) 555-0148',
  timezone: 'America/Chicago',
  taxRate: 0.0825,
  governingState: 'TX',
  arbitration: true,
  defaults: {
    minRenterAge: 25,
    depositAmount: 2500,
    depositReleaseDays: 5,
    includedMilesPerDay: 100,
    overagePerMile: 3,
    postReturnChargeWindowDays: 45,
    fees: DEFAULT_FEES,
    rules: DEFAULT_RULES,
    insuranceRequirement: 'renter-policy',
  },
  payments: {
    acceptCard: true,
    acceptAch: true,
    acceptCash: true,
    acceptZelle: true,
    acceptCashApp: false,
    acceptWire: true,
    acceptCrypto: false,
    requireCardOnFile: true,
  },
  sounds: true,
  theme: 'system',
};

const base = (v: Partial<Vehicle> & Pick<Vehicle, 'slug' | 'vin' | 'year' | 'make' | 'model' | 'color' | 'class' | 'rates' | 'depositDefault'>): Vehicle => ({
  id: `veh_${v.slug.replace(/-/g, '').slice(0, 14)}`,
  status: 'available',
  odometer: 4200,
  includedMilesPerDay: 100,
  overagePerMile: 3,
  minRenterAge: 25,
  seats: 2,
  gps: { provider: 'Trackhawk', deviceId: `TH-${Math.floor(100000 + Math.random() * 900000)}`, starterInterrupt: true },
  createdAt: t('2026-01-10'),
  updatedAt: t('2026-08-20'),
  heroImage: `/media/vehicles/${v.slug}.jpg`,
  ...v,
});

export const SEED_VEHICLES: Vehicle[] = [
  base({ slug: 'lamborghini-huracan-tecnica', vin: 'ZHWUT4ZF9RLA21874', year: 2024, make: 'Lamborghini', model: 'Huracán', trim: 'Tecnica', color: 'Verde Mantis', interior: 'Nero Ade', class: 'supercar', plate: 'NVW 401', plateState: 'TX', odometer: 3810, horsepower: 631, zeroToSixty: 3.2, topSpeed: 202, transmission: '7-speed dual clutch', drive: 'RWD', fuelType: 'Gasoline', rates: { daily: 1650, weekly: 9900, monthly: 34000 }, depositDefault: 7500, overagePerMile: 4, featured: true, tagline: 'Naturally aspirated V10. Rear-wheel drive. The last of its kind.', description: 'The Tecnica is the Huracán distilled: 631 horsepower from a 5.2-litre V10 that revs to 8,500 rpm, rear-wheel drive, and rear-wheel steering. It is the car people rent when they want the sound.' }),
  base({ slug: 'ferrari-roma', vin: 'ZFF98RNA6P0289416', year: 2023, make: 'Ferrari', model: 'Roma', color: 'Rosso Corsa', interior: 'Cuoio', class: 'grand-tourer', plate: 'NVW 402', plateState: 'TX', odometer: 6120, horsepower: 612, zeroToSixty: 3.3, topSpeed: 199, transmission: '8-speed dual clutch', drive: 'RWD', fuelType: 'Gasoline', seats: 4, rates: { daily: 1450, weekly: 8700, monthly: 29500 }, depositDefault: 7500, overagePerMile: 4, featured: true, tagline: 'La Nuova Dolce Vita. Twin-turbo V8, front-engined, unhurried.', description: 'A 2+ grand tourer with a 3.9-litre twin-turbo V8 and a cabin that feels tailored. The Roma is the Ferrari for dinner across town and the coast by the weekend.' }),
  base({ slug: 'porsche-911-turbo-s', vin: 'WP0AD2A93RS263107', year: 2024, make: 'Porsche', model: '911 Turbo S', trim: '992', color: 'Chalk', interior: 'Black leather', class: 'supercar', plate: 'NVW 403', plateState: 'TX', odometer: 7940, horsepower: 640, zeroToSixty: 2.6, topSpeed: 205, transmission: '8-speed PDK', drive: 'AWD', fuelType: 'Gasoline', seats: 4, rates: { daily: 1150, weekly: 6900, monthly: 23500 }, depositDefault: 5000, overagePerMile: 3.5, featured: true, tagline: 'Two point six seconds to sixty. Every day of the year.', description: 'All-wheel drive, 640 horsepower, and the most usable supercar on the road. Chalk over black. The Turbo S is the one you take when the plan changes at the last minute.' }),
  base({ slug: 'mclaren-720s-spider', vin: 'SBM14FCA9PW009523', year: 2023, make: 'McLaren', model: '720S Spider', color: 'Papaya Spark', interior: 'Carbon black Alcantara', class: 'convertible', plate: 'NVW 404', plateState: 'TX', odometer: 5210, horsepower: 710, zeroToSixty: 2.8, topSpeed: 212, transmission: '7-speed SSG', drive: 'RWD', fuelType: 'Gasoline', rates: { daily: 1750, weekly: 10500, monthly: 36000 }, depositDefault: 10000, overagePerMile: 4.5, tagline: 'Retractable hardtop. Seven hundred and ten horsepower. Papaya.', description: 'Carbon tub, dihedral doors, and a roof that disappears in eleven seconds. The 720S Spider is the most theatrical car in the fleet and the fastest.' }),
  base({ slug: 'rolls-royce-cullinan', vin: 'SLATV4C07RU213688', year: 2024, make: 'Rolls-Royce', model: 'Cullinan', trim: 'Black Badge', color: 'Arctic White', interior: 'Charles Blue', class: 'luxury-suv', plate: 'NVW 405', plateState: 'TX', odometer: 2870, horsepower: 592, zeroToSixty: 4.9, topSpeed: 155, transmission: '8-speed automatic', drive: 'AWD', fuelType: 'Gasoline', seats: 5, rates: { daily: 2100, weekly: 12600, monthly: 42000 }, depositDefault: 10000, overagePerMile: 5, featured: true, tagline: 'Effortless everywhere. Starlight headliner included.', description: 'Six point seven five litres of twin-turbo V12, a starlight headliner, and doors that close themselves. For weddings, arrivals, and the days that need to feel like an occasion.' }),
  base({ slug: 'mercedes-amg-g63', vin: 'W1NYC7HJ4RX512094', year: 2024, make: 'Mercedes-AMG', model: 'G 63', color: 'Obsidian Black', interior: 'Red Nappa', class: 'luxury-suv', plate: 'NVW 406', plateState: 'TX', odometer: 9350, horsepower: 577, zeroToSixty: 4.5, topSpeed: 149, transmission: '9-speed automatic', drive: 'AWD', fuelType: 'Gasoline', seats: 5, rates: { daily: 895, weekly: 5400, monthly: 18500 }, depositDefault: 3500, overagePerMile: 2.5, includedMilesPerDay: 125, tagline: 'The box. Handbuilt twin-turbo V8 and side-exit exhausts.', description: 'The G 63 is the most requested vehicle in the fleet for a reason: five seats, presence, and an AMG V8 that announces itself at every light.' }),
  base({ slug: 'bentley-continental-gt', vin: 'SCBCG2ZG7PC084417', year: 2023, make: 'Bentley', model: 'Continental GT', trim: 'Speed', color: 'Beluga', interior: 'Linen and Beluga', class: 'grand-tourer', plate: 'NVW 407', plateState: 'TX', odometer: 8100, horsepower: 650, zeroToSixty: 3.5, topSpeed: 208, transmission: '8-speed dual clutch', drive: 'AWD', fuelType: 'Gasoline', seats: 4, rates: { daily: 1050, weekly: 6300, monthly: 21500 }, depositDefault: 5000, overagePerMile: 3, includedMilesPerDay: 125, tagline: 'W12. Rotating display. Eight hundred miles in a day, gladly.', description: 'A hand-finished cabin, a 6.0-litre W12, and the composure to cover a state in a day. The Continental GT Speed is the fleet\'s long-distance car.' }),
  base({ slug: 'lamborghini-urus-s', vin: 'ZPBUA1ZL8RLA30741', year: 2024, make: 'Lamborghini', model: 'Urus', trim: 'S', color: 'Nero Noctis', interior: 'Nero Ade with Giallo stitching', class: 'luxury-suv', plate: 'NVW 408', plateState: 'TX', odometer: 4460, horsepower: 657, zeroToSixty: 3.4, topSpeed: 190, transmission: '8-speed automatic', drive: 'AWD', fuelType: 'Gasoline', seats: 5, rates: { daily: 1250, weekly: 7500, monthly: 25500 }, depositDefault: 5000, overagePerMile: 3.5, tagline: 'Five seats, six hundred and fifty seven horsepower.', description: 'The Urus S is the supercar you can bring people in. Twin-turbo V8, air suspension, and a cabin trimmed like the Huracán.' }),
  base({ slug: 'corvette-z06', vin: '1G1YF2D33P5121586', year: 2023, make: 'Chevrolet', model: 'Corvette Z06', trim: '3LZ Z07', color: 'Torch Red', interior: 'Jet Black', class: 'supercar', plate: 'NVW 409', plateState: 'TX', odometer: 6740, horsepower: 670, zeroToSixty: 2.6, topSpeed: 195, transmission: '8-speed dual clutch', drive: 'RWD', fuelType: 'Gasoline', rates: { daily: 650, weekly: 3900, monthly: 13500 }, depositDefault: 2500, overagePerMile: 2.5, includedMilesPerDay: 125, minRenterAge: 25, tagline: 'Flat-plane V8 to 8,600 rpm. America\'s exotic.', description: 'A 5.5-litre flat-plane-crank V8 that sounds like Maranello and a mid-engine chassis that is genuinely world-class. The Z06 is the fleet\'s best value per decibel.' }),
  base({ slug: 'range-rover-autobiography', vin: 'SALKPBE94RA184052', year: 2024, make: 'Land Rover', model: 'Range Rover', trim: 'Autobiography LWB', color: 'Santorini Black', interior: 'Caraway', class: 'luxury-suv', plate: 'NVW 410', plateState: 'TX', odometer: 11200, horsepower: 523, zeroToSixty: 4.4, topSpeed: 155, transmission: '8-speed automatic', drive: 'AWD', fuelType: 'Gasoline', seats: 7, rates: { daily: 595, weekly: 3500, monthly: 12000 }, depositDefault: 2000, overagePerMile: 2, includedMilesPerDay: 150, minRenterAge: 25, tagline: 'Long wheelbase. Executive rear seats. Quietest cabin in the fleet.', description: 'The Autobiography LWB with the 4.4-litre twin-turbo V8 is the fleet\'s executive transport: seven seats, reclining rear thrones, and a cabin that closes the world out.' }),
  base({ slug: 'maserati-mc20', vin: 'ZAMAS3B3XP0398127', year: 2023, make: 'Maserati', model: 'MC20', color: 'Bianco Audace', interior: 'Nero Alcantara', class: 'supercar', plate: 'NVW 411', plateState: 'TX', odometer: 3390, horsepower: 621, zeroToSixty: 2.9, topSpeed: 202, transmission: '8-speed dual clutch', drive: 'RWD', fuelType: 'Gasoline', rates: { daily: 1250, weekly: 7500, monthly: 25500 }, depositDefault: 5000, overagePerMile: 3.5, tagline: 'Butterfly doors. Nettuno V6. Rarer than anything else here.', description: 'A carbon-fibre monocoque, butterfly doors, and Maserati\'s in-house 3.0-litre twin-turbo Nettuno V6. You will not see another one.' }),
  base({ slug: 'porsche-taycan-turbo-s', vin: 'WP0AC2Y1XRSA71538', year: 2024, make: 'Porsche', model: 'Taycan Turbo S', color: 'Frozen Blue Metallic', interior: 'Bordeaux Red', class: 'ev', plate: 'NVW 412', plateState: 'TX', odometer: 5880, horsepower: 938, zeroToSixty: 2.3, topSpeed: 162, transmission: '2-speed', drive: 'AWD', fuelType: 'Electric', seats: 4, rates: { daily: 795, weekly: 4800, monthly: 16500 }, depositDefault: 3500, overagePerMile: 2.5, includedMilesPerDay: 125, tagline: 'Nine hundred and thirty eight horsepower. Silent. Two point three to sixty.', description: 'The fastest-accelerating car in the fleet is electric. Over-air launch control, 800-volt charging, and a cabin in Bordeaux red leather.' }),
];

export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cus_okafor', firstName: 'Marcus', middleName: 'Adebayo', lastName: 'Okafor', email: 'm.okafor@westbridgecap.com', phone: '(832) 555-0174',
    dateOfBirth: '1986-03-14', address: { line1: '2727 Kirby Dr', line2: 'Unit 21H', city: 'Houston', state: 'TX', postalCode: '77098', country: 'US', formatted: '2727 Kirby Dr, Unit 21H, Houston, TX 77098' },
    license: { number: '41927366', state: 'TX', expires: '2029-03-14', verifiedAt: t('2026-02-02T15:10:00') },
    insurance: { mode: 'renter-policy', carrier: 'Chubb', policyNumber: 'CHB-8821-4470', expires: '2027-01-31', liabilityLimits: '250/500/100', transfersToRental: true, verifiedAt: t('2026-02-02T15:12:00') },
    flags: ['vip'], notes: 'Repeat client. Prefers weekend pickups after 6pm. Always returns full.', rentalCount: 6, lifetimeValue: 41850, createdAt: t('2026-02-02'), updatedAt: t('2026-08-19'),
  },
  {
    id: 'cus_vasquez', firstName: 'Delaney', lastName: 'Vasquez-Ruiz', email: 'delaney.vr@gmail.com', phone: '(713) 555-0129',
    dateOfBirth: '1992-11-02', address: { line1: '1400 Post Oak Blvd', city: 'Houston', state: 'TX', postalCode: '77056', country: 'US', formatted: '1400 Post Oak Blvd, Houston, TX 77056' },
    license: { number: '30588120', state: 'TX', expires: '2027-11-02', verifiedAt: t('2026-05-11T11:40:00') },
    insurance: { mode: 'company-cdw' },
    flags: [], notes: 'Content creator. Ask for shoot location in advance; no track footage.', rentalCount: 2, lifetimeValue: 9300, createdAt: t('2026-05-11'), updatedAt: t('2026-08-28'),
  },
  {
    id: 'cus_raghunathan', firstName: 'Priya', lastName: 'Raghunathan', email: 'priya.r@helixbio.co', phone: '(281) 555-0193',
    dateOfBirth: '1979-07-23', address: { line1: '5 Riverway', city: 'Houston', state: 'TX', postalCode: '77056', country: 'US', formatted: '5 Riverway, Houston, TX 77056' },
    license: { number: '22014477', state: 'TX', expires: '2028-07-23', verifiedAt: t('2026-06-30T09:05:00') },
    insurance: { mode: 'renter-policy', carrier: 'USAA', policyNumber: 'USAA-0093-1121', expires: '2026-12-15', liabilityLimits: '100/300/100', transfersToRental: true, verifiedAt: t('2026-06-30T09:08:00') },
    flags: [], rentalCount: 1, lifetimeValue: 12600, createdAt: t('2026-06-30'), updatedAt: t('2026-07-21'),
  },
  {
    id: 'cus_bellamy', firstName: 'Trent', lastName: 'Bellamy', email: 'tbellamy88@yahoo.com', phone: '(346) 555-0111',
    dateOfBirth: '1988-01-19', address: { line1: '9800 Westheimer Rd', line2: 'Apt 1207', city: 'Houston', state: 'TX', postalCode: '77042', country: 'US', formatted: '9800 Westheimer Rd, Apt 1207, Houston, TX 77042' },
    license: { number: '18830562', state: 'TX', expires: '2026-10-01' },
    flags: ['do-not-rent'], notes: 'Returned G 63 nine hours late in May, disputed the late charge with his bank. Chargeback won with photos and signed contract. Do not rent.', rentalCount: 1, lifetimeValue: 2685, createdAt: t('2026-05-02'), updatedAt: t('2026-06-14'),
  },
];

const mkRental = (r: Partial<Rental> & Pick<Rental, 'number' | 'status' | 'vehicleId' | 'customerId' | 'terms' | 'deposit' | 'payment'>): Rental => ({
  id: `rnt_${r.number.replace(/\W/g, '').toLowerCase()}`,
  additionalDrivers: [],
  fees: DEFAULT_FEES,
  rules: DEFAULT_RULES,
  signatures: [],
  installments: [],
  deductions: [],
  timeline: [],
  extensions: [],
  createdAt: r.terms.startAt,
  updatedAt: r.terms.startAt,
  ...r,
});

export const SEED_RENTALS: Rental[] = [
  mkRental({
    number: 'NW-2026-0041', status: 'active', vehicleId: 'veh_lamborghinihur', customerId: 'cus_okafor',
    terms: { startAt: t('2026-09-01T18:00:00'), endAt: t('2026-09-08T18:00:00'), unit: 'week', quantity: 1, rate: 9900, includedMiles: 700, overagePerMile: 4, taxRate: 0.0825, discount: 0, renewalIntent: 'likely', renewalRate: 9900, delivery: { enabled: false, fee: 0, returnPickup: false } },
    deposit: { required: true, amount: 7500, method: 'card-hold', holdReference: 'auth_9f31k', releaseDaysAfterReturn: 5, authorizedDeductions: ['damage', 'fuel', 'cleaning', 'tolls', 'mileage', 'late'] },
    payment: { method: 'card-on-file', schedule: 'upfront', downPayment: 10716.75, cardLast4: '4471', cardBrand: 'Amex', cardOnFileAuthorized: true, postReturnChargeWindowDays: 45 },
    checkout: { at: t('2026-09-01T17:48:00'), odometer: 3810, fuelLevel: 1, damages: [{ id: 'dmg_1', zone: 'front-splitter', severity: 'scuff', note: 'Light underside scuff, pre-existing' }], photos: [], exteriorNotes: 'Clean. Paint protection film intact.' },
    installments: [{ id: 'inst_41a', dueAt: t('2026-09-01T18:00:00'), amount: 10716.75, label: 'Full rental payment', status: 'paid', paidAmount: 10716.75, paidAt: t('2026-09-01T17:55:00'), method: 'card-on-file', reference: 'ch_2M4k9' }],
    signatures: [{ role: 'renter', name: 'Marcus Adebayo Okafor', dataUrl: '', signedAt: t('2026-09-01T17:52:00'), method: 'in-person', consentToElectronicRecords: true }, { role: 'dealer', name: 'Nova Wheels', dataUrl: '', signedAt: t('2026-09-01T17:53:00'), method: 'in-person', consentToElectronicRecords: true }],
    timeline: [
      { id: uid('ev'), at: t('2026-08-29T10:12:00'), type: 'created', summary: 'Rental drafted from phone inquiry' },
      { id: uid('ev'), at: t('2026-09-01T17:52:00'), type: 'signed-renter', summary: 'Renter signed in person' },
      { id: uid('ev'), at: t('2026-09-01T17:55:00'), type: 'payment', summary: 'Amex 4471 charged $10,716.75' },
      { id: uid('ev'), at: t('2026-09-01T18:02:00'), type: 'checked-out', summary: 'Checked out at 3,810 mi, full tank' },
      { id: uid('ev'), at: t('2026-09-03T22:41:00'), type: 'gps-alert', summary: 'Geofence: vehicle 212 mi from lot (Austin). Inside state limit.' },
    ],
  }),
  mkRental({
    number: 'NW-2026-0043', status: 'active', vehicleId: 'veh_mercedesamgg63', customerId: 'cus_vasquez',
    terms: { startAt: t('2026-08-28T12:00:00'), endAt: t('2026-09-27T12:00:00'), unit: 'month', quantity: 1, rate: 18500, includedMiles: 3000, overagePerMile: 2.5, taxRate: 0.0825, discount: 500, renewalIntent: 'auto-renew', renewalRate: 18500, delivery: { enabled: true, address: { line1: '1400 Post Oak Blvd', city: 'Houston', state: 'TX', postalCode: '77056', country: 'US' }, fee: 150, returnPickup: true } },
    deposit: { required: true, amount: 3500, method: 'card-charge', releaseDaysAfterReturn: 5, authorizedDeductions: ['damage', 'fuel', 'cleaning', 'tolls', 'mileage', 'late', 'smoking'] },
    payment: { method: 'card-on-file', schedule: 'weekly', downPayment: 5000, cardLast4: '0928', cardBrand: 'Visa', cardOnFileAuthorized: true, postReturnChargeWindowDays: 45 },
    checkout: { at: t('2026-08-28T11:40:00'), odometer: 9350, fuelLevel: 0.875, damages: [], photos: [] },
    installments: [
      { id: 'inst_43a', dueAt: t('2026-08-28T12:00:00'), amount: 5000, label: 'First payment (at pickup)', status: 'paid', paidAmount: 5000, paidAt: t('2026-08-28T11:50:00'), method: 'card-on-file' },
      { id: 'inst_43b', dueAt: t('2026-09-04T12:00:00'), amount: 4934.06, label: 'Payment 2 of 5', status: 'due', paidAmount: 0 },
      { id: 'inst_43c', dueAt: t('2026-09-11T12:00:00'), amount: 4934.06, label: 'Payment 3 of 5', status: 'scheduled', paidAmount: 0 },
      { id: 'inst_43d', dueAt: t('2026-09-18T12:00:00'), amount: 4934.06, label: 'Payment 4 of 5', status: 'scheduled', paidAmount: 0 },
      { id: 'inst_43e', dueAt: t('2026-09-25T12:00:00'), amount: 300.07, label: 'Payment 5 of 5', status: 'scheduled', paidAmount: 0 },
    ],
    signatures: [{ role: 'renter', name: 'Delaney Vasquez-Ruiz', dataUrl: '', signedAt: t('2026-08-27T21:14:00'), method: 'remote-link', consentToElectronicRecords: true }, { role: 'dealer', name: 'Nova Wheels', dataUrl: '', signedAt: t('2026-08-28T09:00:00'), method: 'in-person', consentToElectronicRecords: true }],
    timeline: [
      { id: uid('ev'), at: t('2026-08-26T14:30:00'), type: 'created', summary: 'Monthly rental drafted' },
      { id: uid('ev'), at: t('2026-08-27T20:58:00'), type: 'sent-for-signature', summary: 'Signing link sent by text' },
      { id: uid('ev'), at: t('2026-08-27T21:14:00'), type: 'signed-renter', summary: 'Renter signed remotely (iPhone)' },
      { id: uid('ev'), at: t('2026-08-28T12:05:00'), type: 'checked-out', summary: 'Delivered to Post Oak Blvd at 9,350 mi' },
    ],
  }),
  mkRental({
    number: 'NW-2026-0039', status: 'closed', vehicleId: 'veh_porsche911turb', customerId: 'cus_raghunathan',
    terms: { startAt: t('2026-07-11T10:00:00'), endAt: t('2026-07-18T10:00:00'), unit: 'week', quantity: 1, rate: 6900, includedMiles: 700, overagePerMile: 3.5, taxRate: 0.0825, discount: 0, renewalIntent: 'none', delivery: { enabled: false, fee: 0, returnPickup: false } },
    deposit: { required: true, amount: 5000, method: 'card-hold', releaseDaysAfterReturn: 5, authorizedDeductions: ['damage', 'fuel', 'cleaning', 'tolls', 'mileage', 'late'] },
    payment: { method: 'card-on-file', schedule: 'upfront', downPayment: 7469.25, cardLast4: '3310', cardBrand: 'Visa', cardOnFileAuthorized: true, postReturnChargeWindowDays: 45 },
    checkout: { at: t('2026-07-11T09:45:00'), odometer: 7180, fuelLevel: 1, damages: [], photos: [] },
    checkin: { at: t('2026-07-18T09:30:00'), odometer: 7940, fuelLevel: 0.75, damages: [], photos: [] },
    installments: [{ id: 'inst_39a', dueAt: t('2026-07-11T10:00:00'), amount: 7469.25, label: 'Full rental payment', status: 'paid', paidAmount: 7469.25, paidAt: t('2026-07-11T09:50:00'), method: 'card-on-file' }],
    deductions: [
      { id: 'ded_1', category: 'mileage', amount: 210, note: '760 mi driven, 60 over allowance at $3.50', evidence: [], at: t('2026-07-18T10:10:00') },
      { id: 'ded_2', category: 'fuel', amount: 95, note: 'Returned at 3/4 tank. 2 eighths at $35 plus $25 service', evidence: [], at: t('2026-07-18T10:12:00') },
      { id: 'ded_3', category: 'toll', amount: 47.6, note: 'Two Harris County toll events ($8.80) plus $15 admin each. Received 07/29.', evidence: [], at: t('2026-07-29T15:00:00') },
    ],
    signatures: [{ role: 'renter', name: 'Priya Raghunathan', dataUrl: '', signedAt: t('2026-07-11T09:41:00'), method: 'in-person', consentToElectronicRecords: true }, { role: 'dealer', name: 'Nova Wheels', dataUrl: '', signedAt: t('2026-07-11T09:42:00'), method: 'in-person', consentToElectronicRecords: true }],
    timeline: [
      { id: uid('ev'), at: t('2026-07-11T09:41:00'), type: 'signed-renter', summary: 'Signed in person' },
      { id: uid('ev'), at: t('2026-07-18T09:30:00'), type: 'checked-in', summary: 'Returned early, 7,940 mi, 3/4 tank' },
      { id: uid('ev'), at: t('2026-07-18T10:15:00'), type: 'deduction', summary: 'Mileage and fuel deducted: $305' },
      { id: uid('ev'), at: t('2026-07-23T11:00:00'), type: 'deposit-released', summary: 'Deposit hold released less $305' },
      { id: uid('ev'), at: t('2026-07-29T15:00:00'), type: 'deduction', summary: 'Late toll notice charged to card on file: $47.60' },
      { id: uid('ev'), at: t('2026-07-29T15:01:00'), type: 'closed', summary: 'Rental closed' },
    ],
  }),
];

// Mark seed vehicles rented where a seed rental is active
for (const r of SEED_RENTALS) {
  if (r.status === 'active') {
    const v = SEED_VEHICLES.find((x) => x.id === r.vehicleId);
    if (v) v.status = 'rented';
  }
}
