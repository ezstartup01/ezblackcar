alter table public.quote_requests
  add column if not exists customer_name text,
  add column if not exists special_instructions text,
  add column if not exists billing_zip text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists payment_status text not null default 'not_started',
  add column if not exists payment_authorized_at timestamptz,
  add column if not exists amount_authorized numeric,
  add column if not exists amount_captured numeric default 0;

create index if not exists quote_requests_stripe_payment_intent_id_idx
  on public.quote_requests(stripe_payment_intent_id);

create index if not exists quote_requests_payment_status_idx
  on public.quote_requests(payment_status);
