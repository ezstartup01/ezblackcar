create table if not exists public.ride_change_requests (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text,
  change_type text not null,
  message text not null,
  payment_reference text,
  amount_authorized numeric,
  status text not null default 'new',
  source text not null default 'authorization_screen'
);

create index if not exists ride_change_requests_quote_request_id_idx
  on public.ride_change_requests(quote_request_id);

create index if not exists ride_change_requests_status_idx
  on public.ride_change_requests(status);

alter table public.ride_change_requests enable row level security;

drop policy if exists "Service role can manage ride change requests" on public.ride_change_requests;
create policy "Service role can manage ride change requests"
  on public.ride_change_requests
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
