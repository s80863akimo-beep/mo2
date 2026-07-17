begin;

alter table public.orders
  add column if not exists correction_slip boolean not null default false,
  add column if not exists correction_for_order_id text,
  add column if not exists correction_for_date date,
  add column if not exists correction_reason text;

-- 舊版 amount 欄位的單欄非負檢查只會引用 amount 本身。
-- 同時比對 conkey 與正規化後的完整運算式，避免把 cash_amount >= 0 誤判成 amount >= 0。
do $$
declare
  constraint_record record;
  amount_attnum smallint;
  normalized_expression text;
begin
  select a.attnum
  into amount_attnum
  from pg_attribute a
  where a.attrelid = 'public.orders'::regclass
    and a.attname = 'amount'
    and not a.attisdropped;

  for constraint_record in
    select c.conname, pg_get_expr(c.conbin, c.conrelid) as expression
    from pg_constraint c
    where c.conrelid = 'public.orders'::regclass
      and c.contype = 'c'
      and c.conkey = array[amount_attnum]::smallint[]
  loop
    normalized_expression := regexp_replace(
      constraint_record.expression,
      '[[:space:]()]',
      '',
      'g'
    );

    if normalized_expression in ('amount>=0', 'amount>=0::bigint') then
      execute format(
        'alter table public.orders drop constraint %I',
        constraint_record.conname
      );
    end if;
  end loop;
end $$;

alter table public.orders
  drop constraint if exists orders_amount_regular_or_correction_check,
  add constraint orders_amount_regular_or_correction_check
    check ((correction_slip and amount <> 0) or (not correction_slip and amount >= 0));

-- 明確保留現金拆帳非負限制；重跑 migration 也只替換同名約束。
alter table public.orders
  drop constraint if exists orders_cash_amount_nonnegative_check,
  add constraint orders_cash_amount_nonnegative_check
    check (cash_amount is null or cash_amount >= 0);

comment on column public.orders.correction_slip is 'True when this row is a post-closeout correction slip instead of an original service record.';
comment on column public.orders.correction_for_order_id is 'Original locked order id that this correction slip adjusts.';
comment on column public.orders.correction_for_date is 'Original locked order date that this correction slip adjusts.';
comment on column public.orders.correction_reason is 'Human-readable audit detail for the correction.';

commit;
