# Nova Wheels: agent handoff

This file is for any coding agent (Codex, Claude Code, Cursor) picking the project up. Read it first, then `README.md`, then `docs/OPERATIONS.md`.

## Where things stand

- Branch `claude/novo-wheels-rental-site-dltnc6` carries the whole build. Draft PR #1 targets `main`. `main` still holds the old xlnc-perception code and should be replaced by merging the PR.
- `npm install && npm run build` passes (TypeScript project build plus Vite). `npm run dev` serves on http://localhost:5173.
- Admin login in local mode: `owner@novawheels.com` / `nova2026`. All data persists in the browser (zustand persist) until Supabase env vars are set. Supabase is intentionally not connected for this client yet.
- A narrated pitch video and transcript live in `deliverables/`. The Remotion project that produced them is in `video/` (footage and audio are generated locally and git-ignored; see `video/README.md`).
- Hosted single-file preview build: `npx vite build --config vite.artifact.config.ts` writes `dist-artifact/index.html` with hash routing.

## The next job: pivot the fleet from exotics to economy and commercial

The client rents **economy and commercial vehicles** (cargo vans, pickups, box trucks, minivans, compact and midsize sedans, SUVs) to consumers and small businesses. The current site and seed data are written for exotics (Lamborghini, Ferrari, G63). Keep the design system, the operations dashboard, the Handle-a-Rental flow, the contract engine, and the signing funnel. Change what the site sells and how it talks.

Work in this order and keep each step building:

1. **Vehicle taxonomy.** `src/lib/types.ts` `VehicleClass` becomes something like `'economy' | 'midsize' | 'suv' | 'minivan' | 'pickup' | 'cargo-van' | 'box-truck' | 'ev'`. Update every label map that lists classes: `src/pages/site/Fleet.tsx` (filter chips), `src/pages/admin/VehicleForm.tsx` (`CLASSES` and `blank()` defaults), and the VIN body-class mapping in `src/pages/admin/rental/steps1.tsx`. Search for `supercar` to find every use.
2. **Seed fleet.** Rewrite `src/data/seed.ts` vehicles to a realistic economy/commercial fleet (Ford Transit 250 cargo, Ram ProMaster, Chevy Silverado 1500, Toyota Camry, Nissan Altima, Toyota Corolla, Honda Odyssey, Ford Explorer, Isuzu NPR or Ford E-350 box truck, Tesla Model 3). Daily rates roughly $45 to $190, deposits $200 to $1,000, included miles 150 to 200 per day, overage $0.25 to $0.45 per mile, minimum age 21 (25 for box trucks and vans over 10,000 GVWR). Keep vehicle ids as `veh_` + slug without dashes sliced to 14 characters, and keep the sample customers and rentals valid against the new ids.
3. **Defaults and settings.** `DEFAULT_SETTINGS` in `src/data/seed.ts`: default deposit, included miles, overage rate, minimum age, and any copy that says exotic or luxury.
4. **Contract clauses.** `src/data/clauses.ts`: allow commercial and business use where the vehicle class is commercial, add cargo and load-securing, weight-limit, and tolls clauses, soften the exotic-specific clauses (track use, launch control, valet) or remove them. Every clause keeps its `plain` line.
5. **Site copy and structure.** Home, Fleet, Vehicle, Experience (rename to something like "How it works"), Requirements/FAQ, Contact, and the Reserve funnel in `src/pages/site/`. Position on reliability, transparent pricing, same-day pickup, business accounts, weekly and monthly rates, and moving/hauling use cases. Keep the gold accent, the typography, the preloader, the menu, and the transitions. The tone shifts from exotic indulgence to dependable, well-run, premium-for-its-category.
6. **Imagery.** `docs/IMAGE_BRIEF.md` lists the prompts and file names. Regenerate for the new fleet and drop files into `public/media/vehicles/<slug>.jpg`. Until images exist the `VehicleImage` component renders a typographic plate, so nothing breaks.
7. **Pitch video.** Re-record and re-render `video/` after the pivot (see `video/README.md`). Not required to ship the site.

Design constraints that already hold and should keep holding: no em-dashes in visible copy, Tailwind v4 custom classes live in `@layer components` / `@layer base` in `src/styles/globals.css`, gold tokens are `--accent`, `--accent-fg`, `--accent-ink`, and the site (`.world-site`) and admin (`.world-admin`) token scopes stay separate.

## Deploy

- `vercel.json` already carries the SPA rewrite. Vite is auto-detected. No env vars are required for local mode.
- To connect Supabase later: run `supabase/migrations/0001_nova_wheels.sql`, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
