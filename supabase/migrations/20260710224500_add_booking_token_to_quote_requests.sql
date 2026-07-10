alter table public.quote_requests
  add column if not exists booking_token uuid default gen_random_uuid(),
  add column if not exists authorization_email_sent_at timestamptz;

update public.quote_requests
set booking_token = gen_random_uuid()
where booking_token is null;

create unique index if not exists quote_requests_booking_token_idx
  on public.quote_requests(booking_token);
