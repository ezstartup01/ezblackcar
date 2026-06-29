create table if not exists public.quote_zones (
  id uuid primary key default gen_random_uuid(),
  zone_name text not null unique,
  city text not null,
  state text default 'MI',
  zip_codes text[],
  aliases text[],
  base_airport_pickup numeric not null,
  base_airport_dropoff numeric not null,
  base_point_to_point numeric,
  min_fare numeric default 95,
  active boolean default true,
  display_order int default 100,
  created_at timestamptz default now()
);

create table if not exists public.quote_rules (
  id uuid primary key default gen_random_uuid(),
  vehicle_type text default 'black_suv',
  included_wait_minutes int default 15,
  airport_pickup_fee numeric default 15,
  late_night_fee numeric default 20,
  extra_stop_fee numeric default 20,
  child_seat_fee numeric default 15,
  gratuity_percent numeric default 20,
  max_passengers int default 6,
  max_luggage int default 5,
  min_fare numeric default 95,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  pickup_date text,
  pickup_time text,
  pickup_location text not null,
  destination text not null,
  phone text,
  email text,
  airport_type text,
  trip_type text,
  pickup_type text,
  pickup_airport text,
  pickup_address text,
  pickup_city text,
  pickup_zip text,
  destination_type text,
  destination_airport text,
  destination_address text,
  destination_city text,
  destination_zip text,
  passengers int,
  luggage_count int,
  flight_number text,
  matched_zone text,
  distance_miles numeric,
  duration_minutes int,
  base_fare numeric,
  airport_fee numeric default 0,
  late_night_fee numeric default 0,
  extra_fees numeric default 0,
  gratuity numeric default 0,
  total_quote numeric,
  quote_status text default 'instant_quote',
  status text not null default 'new',
  source text not null default 'website',
  notes text,
  created_at timestamptz not null default now()
);

alter table public.quote_requests add column if not exists email text;
alter table public.quote_requests add column if not exists trip_type text;
alter table public.quote_requests add column if not exists pickup_type text;
alter table public.quote_requests add column if not exists pickup_airport text;
alter table public.quote_requests add column if not exists pickup_address text;
alter table public.quote_requests add column if not exists pickup_city text;
alter table public.quote_requests add column if not exists pickup_zip text;
alter table public.quote_requests add column if not exists destination_type text;
alter table public.quote_requests add column if not exists destination_airport text;
alter table public.quote_requests add column if not exists destination_address text;
alter table public.quote_requests add column if not exists destination_city text;
alter table public.quote_requests add column if not exists destination_zip text;
alter table public.quote_requests add column if not exists matched_zone text;
alter table public.quote_requests add column if not exists distance_miles numeric;
alter table public.quote_requests add column if not exists duration_minutes int;
alter table public.quote_requests add column if not exists base_fare numeric;
alter table public.quote_requests add column if not exists airport_fee numeric default 0;
alter table public.quote_requests add column if not exists late_night_fee numeric default 0;
alter table public.quote_requests add column if not exists extra_fees numeric default 0;
alter table public.quote_requests add column if not exists gratuity numeric default 0;
alter table public.quote_requests add column if not exists total_quote numeric;
alter table public.quote_requests add column if not exists quote_status text default 'instant_quote';
alter table public.quote_requests add column if not exists notes text;

alter table public.quote_requests
  alter column phone drop not null;

alter table public.quote_requests
  alter column passengers type int using nullif(regexp_replace(passengers::text, '\D', '', 'g'), '')::int;

alter table public.quote_requests
  alter column luggage_count type int using nullif(regexp_replace(luggage_count::text, '\D', '', 'g'), '')::int;

alter table public.quote_zones enable row level security;
alter table public.quote_rules enable row level security;
alter table public.quote_requests enable row level security;

drop policy if exists "Public can read active quote zones" on public.quote_zones;
create policy "Public can read active quote zones"
on public.quote_zones
for select
to anon
using (active = true);

drop policy if exists "Public can read active quote rules" on public.quote_rules;
create policy "Public can read active quote rules"
on public.quote_rules
for select
to anon
using (active = true);

drop policy if exists "Public can create quote requests" on public.quote_requests;
create policy "Public can create quote requests"
on public.quote_requests
for insert
to anon
with check (true);

grant usage on schema public to anon, authenticated;
grant select on public.quote_zones to anon, authenticated;
grant select on public.quote_rules to anon, authenticated;
grant insert on public.quote_requests to anon, authenticated;

insert into public.quote_zones
  (zone_name, city, zip_codes, aliases, base_airport_pickup, base_airport_dropoff, base_point_to_point, min_fare, active, display_order)
values
  ('Dearborn', 'Dearborn', array['48120', '48121', '48123', '48124', '48126', '48128'], null, 95, 95, 105, 95, true, 10),
  ('Dearborn Heights', 'Dearborn Heights', array['48125', '48127'], null, 95, 95, 105, 95, true, 20),
  ('Downtown Detroit', 'Detroit', array['48226', '48243'], array['downtown detroit', 'detroit downtown'], 115, 115, 125, 95, true, 30),
  ('Midtown Detroit', 'Detroit', array['48201', '48202'], array['midtown detroit', 'wayne state'], 115, 115, 125, 95, true, 40),
  ('Detroit East / Grosse Pointe', 'Grosse Pointe', array['48224', '48230', '48236'], array['grosse pointe', 'east detroit'], 135, 135, 145, 95, true, 50),
  ('Southfield', 'Southfield', array['48033', '48034', '48075', '48076'], null, 125, 125, 135, 95, true, 60),
  ('Farmington Hills', 'Farmington Hills', array['48331', '48334', '48335', '48336'], null, 130, 130, 140, 95, true, 70),
  ('Novi', 'Novi', array['48374', '48375', '48377'], null, 145, 145, 155, 95, true, 80),
  ('Troy', 'Troy', array['48083', '48084', '48085', '48098'], null, 145, 145, 155, 95, true, 90),
  ('Birmingham / Bloomfield Hills', 'Birmingham', array['48009', '48301', '48302', '48304'], array['birmingham', 'bloomfield hills', 'bloomfield'], 150, 150, 160, 95, true, 100),
  ('Auburn Hills', 'Auburn Hills', array['48321', '48326'], null, 165, 165, 175, 95, true, 110),
  ('Ann Arbor', 'Ann Arbor', array['48103', '48104', '48105', '48108', '48109'], null, 145, 145, 155, 95, true, 120),
  ('Canton', 'Canton', array['48187', '48188'], null, 115, 115, 125, 95, true, 130),
  ('Livonia', 'Livonia', array['48150', '48152', '48154'], null, 115, 115, 125, 95, true, 140),
  ('Romulus / Taylor / Allen Park', 'Romulus', array['48101', '48122', '48174', '48180'], array['romulus', 'taylor', 'allen park'], 95, 95, 105, 95, true, 150),
  ('Warren / Sterling Heights', 'Warren', array['48088', '48089', '48091', '48092', '48093', '48310', '48312', '48313', '48314'], array['warren', 'sterling heights'], 145, 145, 155, 95, true, 160),
  ('Royal Oak / Ferndale', 'Royal Oak', array['48067', '48069', '48220'], array['royal oak', 'ferndale'], 130, 130, 140, 95, true, 170)
on conflict (zone_name) do update set
  city = excluded.city,
  zip_codes = excluded.zip_codes,
  aliases = excluded.aliases,
  base_airport_pickup = excluded.base_airport_pickup,
  base_airport_dropoff = excluded.base_airport_dropoff,
  base_point_to_point = excluded.base_point_to_point,
  min_fare = excluded.min_fare,
  active = excluded.active,
  display_order = excluded.display_order;

update public.quote_rules
set active = false
where vehicle_type = 'black_suv';

insert into public.quote_rules
  (vehicle_type, included_wait_minutes, airport_pickup_fee, late_night_fee, extra_stop_fee, child_seat_fee, gratuity_percent, max_passengers, max_luggage, min_fare, active)
values
  ('black_suv', 15, 15, 20, 20, 15, 20, 6, 5, 95, true);
