# Nova Wheels

Exotic and luxury car rental. Two surfaces in one codebase:

- **The site** (`/`): cinematic, dark, editorial. Fleet, vehicle pages, requirements, reservation requests.
- **Operations** (`/admin`): the dashboard behind it. Login, first-run onboarding, and the Handle-a-Rental flow that takes a walk-in from "which car" to a signed contract one screen at a time.
- **Signing link** (`/sign/:token`): what the renter opens on their phone. Money terms one at a time with initials, the rules, the full agreement, signature.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. Sign in to `/admin` with `owner@novawheels.com` / `nova2026` (local mode). Everything persists in the browser until you connect Supabase.

## Connect Supabase

1. Create a project, run `supabase/migrations/0001_nova_wheels.sql` in the SQL editor.
2. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Create a staff user under Authentication. Sign in with it.

Every write mirrors to Supabase; on boot, remote rows replace local ones. Row-level security lets anonymous visitors read vehicles and submit reservation requests only. Signing links go through the `rental_for_signing` and `submit_renter_signature` functions, never table access.

## Optional keys

| Variable | What it does | Without it |
|---|---|---|
| `VITE_GOOGLE_PLACES_KEY` | Google Places autocomplete for addresses | Photon (OpenStreetMap) autocomplete, no key needed |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Card tokenization in the payment step | Card brand and last four are recorded manually |

The VIN decoder uses the NHTSA vPIC API and needs no key.

## Photography

Vehicle images are read from `public/media/vehicles/<slug>.jpg`. Until a file exists the site renders a typographic plate so nothing looks broken. See `docs/IMAGE_BRIEF.md` for the exact list, sizes, and prompts.

## Structure

```
src/
  lib/          types, pricing engine, contract renderer, VIN decoder, address autocomplete, sounds
  data/         seed fleet and customers, default contract clauses
  store/        zustand stores (fleet, customers, rentals, templates, settings, auth, wizard draft)
  components/   brand, site, ui primitives, wizard shell, admin layout
  pages/site    Home, Fleet, Vehicle, Experience, Requirements, Contact, Reserve, Sign
  pages/admin   Login, Onboarding, Hub, rental/ (22-screen wizard), Rentals, Inventory, Customers, Contracts, Payments, Settings, Reservations
supabase/migrations   schema, RLS, signing RPCs, media bucket
docs/           OPERATIONS.md (how the business logic works), IMAGE_BRIEF.md
```

## Scripts

- `npm run dev` local server
- `npm run build` typecheck and production build to `dist/`
- `npm run preview` serve the build
