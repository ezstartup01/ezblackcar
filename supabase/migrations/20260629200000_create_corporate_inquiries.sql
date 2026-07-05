create table if not exists public.corporate_inquiries (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  transportation_need text not null,
  estimated_monthly_rides text not null,
  main_areas text,
  billing_preference text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.corporate_inquiries enable row level security;

drop policy if exists "Public can create corporate inquiries" on public.corporate_inquiries;
create policy "Public can create corporate inquiries"
on public.corporate_inquiries
for insert
to anon, authenticated
with check (true);

grant insert on public.corporate_inquiries to anon, authenticated;
