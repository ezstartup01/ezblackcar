create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  pickup_date text,
  pickup_time text,
  pickup_location text not null,
  destination text not null,
  phone text not null,
  airport_type text,
  passengers text,
  luggage_count text,
  email text,
  flight_number text,
  status text not null default 'new',
  source text not null default 'website',
  created_at timestamptz not null default now()
);

alter table public.quote_requests enable row level security;

drop policy if exists "Public can create quote requests" on public.quote_requests;

create policy "Public can create quote requests"
on public.quote_requests
for insert
to anon
with check (true);

grant usage on schema public to anon;
grant insert on public.quote_requests to anon;
