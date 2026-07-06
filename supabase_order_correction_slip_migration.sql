begin;

alter table public.orders
  add column if not exists correction_slip boolean not null default false,
  add column if not exists correction_for_order_id text,
  add column if not exists correction_for_date date,
  add column if not exists correction_reason text;

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'orders'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%amount >= 0%'
  loop
    execute format('alter table public.orders drop constraint %I', constraint_record.conname);
  end loop;
end $$;

alter table public.orders
  drop constraint if exists orders_amount_regular_or_correction_check,
  add constraint orders_amount_regular_or_correction_check
    check ((correction_slip and amount <> 0) or (not correction_slip and amount >= 0));

comment on column public.orders.correction_slip is 'True when this row is a post-closeout correction slip instead of an original service record.';
comment on column public.orders.correction_for_order_id is 'Original locked order id that this correction slip adjusts.';
comment on column public.orders.correction_for_date is 'Original locked order date that this correction slip adjusts.';
comment on column public.orders.correction_reason is 'Human-readable audit detail for the correction.';

commit;
