begin;

alter table public.orders
  add column if not exists actual_duration_minutes integer
  check (actual_duration_minutes is null or actual_duration_minutes > 0);

alter table public.orders
  add column if not exists calendar_duration_minutes integer
  check (calendar_duration_minutes is null or calendar_duration_minutes > 0);

alter table public.orders
  add column if not exists calendar_start_at timestamptz;

alter table public.orders
  add column if not exists calendar_end_at timestamptz;

commit;
