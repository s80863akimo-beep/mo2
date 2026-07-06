begin;

alter table public.closeouts add column if not exists cash bigint not null default 0;
alter table public.closeouts add column if not exists transfer bigint not null default 0;
alter table public.closeouts add column if not exists prepaid_out bigint not null default 0;
alter table public.closeouts add column if not exists prepaid_in bigint not null default 0;
alter table public.closeouts add column if not exists cash_prepaid_in bigint not null default 0;
alter table public.closeouts add column if not exists transfer_prepaid_in bigint not null default 0;
alter table public.closeouts add column if not exists net_profit bigint not null default 0;
alter table public.closeouts add column if not exists orders_count integer not null default 0;
alter table public.closeouts add column if not exists service_orders_count integer not null default 0;
alter table public.closeouts add column if not exists topup_count integer not null default 0;

commit;
