# Nova Wheels operations: how the system thinks

This is the reasoning behind the dashboard. Every rule here came from where rental operators actually lose money: deposit disputes, chargebacks, late tolls, non-returns, and paperwork that was never signed.

## The rental lifecycle

```
draft → awaiting-signature → signed → active → (extended | overdue | non-return) → returned → closed
                                                                                 ↘ cancelled
```

- **draft**: the wizard was started. Resumable from the rental page.
- **awaiting-signature**: a signing link was sent. The hub shows it until the renter signs.
- **signed**: both parties signed. Not yet checked out; the car is still on the lot.
- **active**: checked out. The vehicle flips to `rented`, the clock starts.
- **extended**: a written, prepaid extension moved the return time.
- **overdue**: past the return time. Late charges accrue per the fee schedule.
- **non-return**: 24 hours past return with no written extension. The operator declares it; the timestamp is what the police report needs. Starter interrupt and GPS recovery follow.
- **returned**: check-in inspection done, charges computed.
- **closed**: deposit released or applied, all money settled.

## The Handle-a-Rental flow, screen by screen

One question per screen. Enter advances. Every keystroke clicks. Nothing else on the page.

1. **Which car** - fleet grid; out-on-rental cars are visible but disabled. "Not in inventory" decodes a VIN through NHTSA and creates the vehicle inline.
2. **Condition** - odometer, fuel in eighths, pre-existing marks by zone, photos (compressed, timestamped). Warns below eight photos. This block is what wins a damage claim.
3. **Name** - first, middle, last, as on the license.
4. **Contact** - phone and email. Detects returning customers and offers their file. Blocks anyone flagged do-not-rent with the reason on screen.
5. **License and age** - age gate per car (default 25, per-vehicle override), expiry check, and a mandatory "I compared the physical license to the face and the card" confirmation. Fake-ID rings are the leading cause of exotic theft.
6. **Address** - smart autocomplete. Flags a local address with an out-of-state license.
7. **Insurance** - renter's policy (carrier, number, limits, declarations verified) or the house damage waiver, or both.
8. **Additional drivers** - anyone not listed is unauthorized: coverage voids, $400/day.
9. **Term** - days, weeks, or months; start time; computed return.
10. **Rate** - prefilled from the vehicle for that unit; warns if more than 15% under list.
11. **Mileage** - per-day allowance and overage rate; shows the total.
12. **Deposit?** - yes/no. No skips the next screen.
13. **Deposit amount and method** - card hold (best), card charge, cash, collateral.
14. **Down payment** - full, half, first week, or custom.
15. **Payment method** - card on file (best), ACH, wire, cash, Zelle, Cash App, crypto. Untrackable methods require a risk acknowledgment and a card on file for incidentals anyway.
16. **Schedule** - weekly, biweekly, monthly installments if not paid in full. Shows every due date.
17. **Renewal** - not expected, possibly, or auto-renew, with the extension rate decided now.
18. **Delivery** - lot pickup or delivery to an address with a fee and optional return collection.
19. **Rules and fees** - geographic limit, GPS and starter-interrupt consent, pets, prohibited uses, and every fee.
20. **Review** - every line, tap to edit, live money summary.
21. **Contract and signatures** - the agreement renders from the template. Sign in person (renter then owner) or send a signing link by text or email.
22. **Done** - check out now, or leave it awaiting signature.

## Money rules

- **Quote** = rate × quantity + delivery + additional drivers − discount, then tax. Deposit is separate and never taxed.
- **Installments** are generated from the schedule. The down payment covers the first; if larger, it shrinks the tail.
- **Late**: grace period, then hourly; over six hours late is a full extra day at the daily equivalent.
- **Mileage overage**: driven − included, × per-mile rate.
- **Fuel**: eighths short × fuel fee + $25 service.
- **Smoking, cleaning**: flat fees from the schedule, toggled at check-in with photo evidence expected.
- **Tolls and tickets**: item + admin fee, charged to the card on file whenever the notice arrives, inside the post-return window (default 45 days).

## Why card on file is non-negotiable

Zelle, Cash App, and cash cannot be charged after the fact. A renter paying that way can stop paying at any point and the only recourse is collections. The contract's Card on File clause authorizes charges for the rental, deposit, and every incidental for 45 days after return, and the renter agrees not to dispute charges made under the agreement. In a chargeback, the signed agreement, timestamped check-out and check-in photos, and the itemized statement are the evidence that wins.

## The contract

Templates live in Contracts. Each clause has legal text and an "in plain terms" line. The renter sees both. Tokens (`{{renter.fullName}}`, `{{terms.rate}}`, `{{deposit.amount}}`, `{{vehicle.vin}}`, and so on) fill in per rental. Clauses that do not apply (no deposit, no GPS) drop out automatically.

Dealer positioning baked into the default template:
- Return more than 24 hours late without a written extension is conversion; the owner may report the car stolen and recover it.
- Damage liability regardless of fault, including loss of use without regard to fleet utilization, diminished value, towing, storage, and a $250 administrative fee. Insurance proceeds are assigned to the owner.
- Prohibited-use penalties ($500/day) and unauthorized-driver penalties ($400/day).
- GPS and starter-interrupt disclosure and consent, with tamper penalty.
- Binding individual arbitration with class-action waiver (toggle in Settings).

Client positioning that keeps renters from feeling ambushed:
- Every charge is in writing before signing, with a plain-language line.
- Deposit release timeline stated, deductions itemized with photos.
- A joint, on-camera walk-around at both ends, and the renter gets the photos.
- Extensions are simple: ask before the return time, in writing, prepay.

## Remote signing

The signing link expires in 72 hours. The renter sees the money sections one at a time and types their initials on each, then the rules, then the full document, then signs. The signature stores a timestamp and device details. The rental shows "awaiting signature" on the hub until they finish, then the owner countersigns from the rental page.

## Check-in

Return time, odometer, fuel, smoking and cleaning toggles, notes. Charges compute live: mileage, fuel, late, smoking, cleaning. Completing check-in moves the rental to returned, the vehicle to available, and the charges into deductions. Releasing the deposit closes the rental.

## Tracking

Every vehicle carries its GPS provider and device ID. On an active rental the rental page shows the tracking block with starter-disable and release actions, each of which writes to the timeline so there is a record of when and why the car was immobilized. Declaring non-return is its own action with its own timestamp.

## Data

Local mode stores everything in the browser under `nw.*` keys. With Supabase connected, every write mirrors to Postgres (JSONB documents with generated columns for the fields you query), and `rental_events` flattens every timeline entry for reporting.
