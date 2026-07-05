create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  phone text,
  inquiry_type text not null default 'General Question',
  subject text not null,
  message text not null,
  status text not null default 'new',
  internal_notes text
);

alter table public.contact_messages enable row level security;

drop policy if exists "Service role can manage contact messages" on public.contact_messages;
create policy "Service role can manage contact messages"
  on public.contact_messages
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
