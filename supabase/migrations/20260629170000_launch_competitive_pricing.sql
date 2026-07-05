alter table public.quote_requests
  add column if not exists mileage_charge numeric,
  add column if not exists time_charge numeric,
  add column if not exists manual_review_reasons text,
  add column if not exists pricing_mode text;

alter table public.quote_requests
  alter column status set default 'quote_generated';
