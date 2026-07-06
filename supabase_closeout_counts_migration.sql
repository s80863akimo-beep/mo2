begin;

alter table public.closeouts add column if not exists service_orders_count integer not null default 0;
alter table public.closeouts add column if not exists topup_count integer not null default 0;

commit;
