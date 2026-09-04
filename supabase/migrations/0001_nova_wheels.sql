-- Nova Wheels schema. Documents are stored as JSONB mirrors of the TypeScript
-- types in src/lib/types.ts, with generated columns for the fields you query on.
-- Apply with: supabase db push   (or paste into the SQL editor)

create extension if not exists "pgcrypto";

-- ---------- vehicles ----------
create table if not exists public.vehicles (
  id text primary key,
  data jsonb not null,
  slug text generated always as (data->>'slug') stored,
  vin text generated always as (data->>'vin') stored,
  status text generated always as (data->>'status') stored,
  make text generated always as (data->>'make') stored,
  model text generated always as (data->>'model') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists vehicles_vin_idx on public.vehicles (vin);
create index if not exists vehicles_status_idx on public.vehicles (status);

-- ---------- customers ----------
create table if not exists public.customers (
  id text primary key,
  data jsonb not null,
  email text generated always as (lower(data->>'email')) stored,
  phone text generated always as (regexp_replace(data->>'phone', '\D', '', 'g')) stored,
  last_name text generated always as (data->>'lastName') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customers_email_idx on public.customers (email);
create index if not exists customers_phone_idx on public.customers (phone);

-- ---------- rentals ----------
create table if not exists public.rentals (
  id text primary key,
  data jsonb not null,
  number text generated always as (data->>'number') stored,
  status text generated always as (data->>'status') stored,
  vehicle_id text generated always as (data->>'vehicleId') stored,
  customer_id text generated always as (data->>'customerId') stored,
  signing_token text generated always as (data->>'signingToken') stored,
  start_at timestamptz generated always as ((data->'terms'->>'startAt')::timestamptz) stored,
  end_at timestamptz generated always as ((data->'terms'->>'endAt')::timestamptz) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists rentals_number_idx on public.rentals (number);
create index if not exists rentals_status_idx on public.rentals (status);
create index if not exists rentals_vehicle_idx on public.rentals (vehicle_id);
create index if not exists rentals_customer_idx on public.rentals (customer_id);
create index if not exists rentals_token_idx on public.rentals (signing_token);
create index if not exists rentals_end_idx on public.rentals (end_at);

-- ---------- contract templates ----------
create table if not exists public.contract_templates (
  id text primary key,
  data jsonb not null,
  is_default boolean generated always as ((data->>'isDefault')::boolean) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- reservations (public site requests) ----------
create table if not exists public.reservations (
  id text primary key,
  data jsonb not null,
  status text generated always as (data->>'status') stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- company settings (single row) ----------
create table if not exists public.company_settings (
  id text primary key default 'default',
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- audit: every rental event, flattened for reporting ----------
create table if not exists public.rental_events (
  id bigserial primary key,
  rental_id text not null references public.rentals(id) on delete cascade,
  at timestamptz not null,
  type text not null,
  summary text not null,
  meta jsonb,
  by_user text
);
create index if not exists rental_events_rental_idx on public.rental_events (rental_id, at);

-- Flatten rental.timeline into rental_events on every write.
create or replace function public.sync_rental_events() returns trigger language plpgsql as $$
begin
  delete from public.rental_events where rental_id = new.id;
  insert into public.rental_events (rental_id, at, type, summary, meta, by_user)
  select new.id, (e->>'at')::timestamptz, e->>'type', e->>'summary', e->'meta', e->>'by'
  from jsonb_array_elements(coalesce(new.data->'timeline', '[]'::jsonb)) as e;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists rentals_sync_events on public.rentals;
create trigger rentals_sync_events before insert or update on public.rentals
  for each row execute function public.sync_rental_events();

-- Keep updated_at fresh on the other tables.
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['vehicles','customers','contract_templates','reservations','company_settings'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ---------- row level security ----------
-- Staff (any authenticated user) can do everything. The public site can only
-- read vehicles and insert reservations. Signing links read one rental by token
-- through the RPC below rather than through table access.
alter table public.vehicles enable row level security;
alter table public.customers enable row level security;
alter table public.rentals enable row level security;
alter table public.contract_templates enable row level security;
alter table public.reservations enable row level security;
alter table public.company_settings enable row level security;
alter table public.rental_events enable row level security;

do $$ declare t text; begin
  foreach t in array array['vehicles','customers','rentals','contract_templates','reservations','company_settings','rental_events'] loop
    execute format('drop policy if exists %I_staff_all on public.%I', t, t);
    execute format('create policy %I_staff_all on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

drop policy if exists vehicles_public_read on public.vehicles;
create policy vehicles_public_read on public.vehicles for select to anon using (status <> 'retired');

drop policy if exists reservations_public_insert on public.reservations;
create policy reservations_public_insert on public.reservations for insert to anon with check (true);

-- Signing link: fetch exactly one rental plus its vehicle, customer, and template by token.
create or replace function public.rental_for_signing(p_token text)
returns jsonb language sql security definer stable as $$
  select jsonb_build_object(
    'rental', r.data,
    'vehicle', v.data,
    'customer', c.data,
    'template', t.data,
    'company', s.data
  )
  from public.rentals r
  join public.vehicles v on v.id = r.vehicle_id
  join public.customers c on c.id = r.customer_id
  left join public.contract_templates t on t.id = r.data->'contract'->>'templateId'
  left join public.company_settings s on s.id = 'default'
  where r.signing_token = p_token
    and coalesce((r.data->>'signingExpiresAt')::timestamptz, now() + interval '1 day') > now()
  limit 1;
$$;
grant execute on function public.rental_for_signing(text) to anon, authenticated;

-- Renter signature submission by token: appends the signature and timeline event only.
create or replace function public.submit_renter_signature(p_token text, p_signature jsonb)
returns void language plpgsql security definer as $$
declare r public.rentals;
begin
  select * into r from public.rentals where signing_token = p_token for update;
  if r.id is null then raise exception 'invalid token'; end if;
  if exists (select 1 from jsonb_array_elements(r.data->'signatures') s where s->>'role' = 'renter') then
    raise exception 'already signed';
  end if;
  update public.rentals set data = jsonb_set(
      jsonb_set(data, '{signatures}', coalesce(data->'signatures','[]'::jsonb) || p_signature),
      '{timeline}', coalesce(data->'timeline','[]'::jsonb) || jsonb_build_object('id', gen_random_uuid()::text, 'at', now(), 'type', 'signed-renter', 'summary', 'Renter signed remotely')
    )
  where id = r.id;
end $$;
grant execute on function public.submit_renter_signature(text, jsonb) to anon, authenticated;

-- ---------- storage for check-out / check-in photos and signatures ----------
insert into storage.buckets (id, name, public) values ('rental-media', 'rental-media', false)
on conflict (id) do nothing;
drop policy if exists rental_media_staff on storage.objects;
create policy rental_media_staff on storage.objects for all to authenticated
  using (bucket_id = 'rental-media') with check (bucket_id = 'rental-media');
