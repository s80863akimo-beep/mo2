-- 摸摸頭 momohair Supabase schema v1
-- 在 Supabase Dashboard -> SQL Editor 執行。
-- 所有營運資料都綁定 auth.uid()，anon 無權存取。

begin;

create table if not exists public.customers (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  gender text not null default '女' check (gender in ('女', '男', '其他')),
  merged_into_customer_id text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  constraint customers_merge_target_not_self_check
    check (merged_into_customer_id is null or merged_into_customer_id <> id),
  constraint customers_merge_is_archived_check
    check (merged_into_customer_id is null or archived_at is not null),
  constraint customers_merged_into_owner_fk
    foreign key (owner_id, merged_into_customer_id)
    references public.customers(owner_id, id) on delete restrict
    deferrable initially deferred
);

create table if not exists public.orders (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  customer_id text not null,
  order_date date not null,
  service_name text not null,
  category text,
  amount bigint not null,
  correction_slip boolean not null default false,
  correction_for_order_id text,
  correction_for_date date,
  correction_reason text,
  payment_method text not null check (payment_method in ('現金', '轉帳', '儲值扣款', '現金＋儲值扣款', '儲值進帳')),
  cash_amount bigint,
  topup_channel text check (topup_channel is null or topup_channel in ('現金', '轉帳')),
  actual_duration_minutes integer check (actual_duration_minutes is null or actual_duration_minutes > 0),
  calendar_duration_minutes integer check (calendar_duration_minutes is null or calendar_duration_minutes > 0),
  calendar_start_at timestamptz,
  calendar_end_at timestamptz,
  source text not null default 'manual',
  source_event_id text,
  external_order_id text,
  sync_status text not null default 'active' check (sync_status in ('active', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  constraint orders_customer_owner_fk
    foreign key (owner_id, customer_id)
    references public.customers(owner_id, id) on delete restrict,
  constraint orders_correction_target_owner_fk
    foreign key (owner_id, correction_for_order_id)
    references public.orders(owner_id, id) on delete restrict,
  constraint orders_cash_amount_nonnegative_check
    check (cash_amount is null or cash_amount >= 0),
  constraint orders_cash_amount_shape_v2_check
    check (
      (payment_method = '現金＋儲值扣款' and amount > 0 and cash_amount is not null and cash_amount > 0 and cash_amount < amount)
      or (payment_method <> '現金＋儲值扣款' and cash_amount is null)
    ),
  constraint orders_amount_regular_or_correction_check
    check ((correction_slip and amount <> 0) or (not correction_slip and amount >= 0)),
  constraint orders_mixed_payment_v2_check
    check (
      payment_method <> '現金＋儲值扣款'
      or (amount > 0 and cash_amount is not null and cash_amount > 0 and cash_amount < amount)
    ),
  constraint orders_topup_channel_payment_v2_check
    check (
      (payment_method = '儲值進帳' and topup_channel in ('現金', '轉帳') and topup_channel is not null)
      or (payment_method <> '儲值進帳' and topup_channel is null)
    ),
  constraint orders_correction_audit_v2_check
    check (
      (
        not correction_slip
        and correction_for_order_id is null
        and correction_for_date is null
        and correction_reason is null
      )
      or (
        correction_slip
        and
        correction_for_order_id is not null
        and correction_for_date is not null
        and length(trim(coalesce(correction_reason, ''))) > 0
      )
    )
);

-- append-only：修正與取消都新增 adjustment/reversal，不覆寫舊交易。
create table if not exists public.prepaid_ledger (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  customer_id text not null,
  signed_amount bigint not null check (signed_amount <> 0),
  kind text not null check (kind in ('topup', 'debit', 'adjustment', 'reversal')),
  bucket text not null check (bucket in ('topup', 'debit')),
  effective_date date not null,
  source_order_id text,
  reversal_of_entry_id text,
  transfer_group_id text,
  system_managed boolean not null default false,
  service_name text,
  payment_method text,
  note text not null default '',
  customer_name_snapshot text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, id),
  constraint prepaid_ledger_customer_owner_fk
    foreign key (owner_id, customer_id)
    references public.customers(owner_id, id) on delete restrict,
  constraint prepaid_ledger_source_order_owner_fk
    foreign key (owner_id, source_order_id)
    references public.orders(owner_id, id) on delete restrict,
  constraint prepaid_ledger_reversal_owner_fk
    foreign key (owner_id, reversal_of_entry_id)
    references public.prepaid_ledger(owner_id, id) on delete restrict,
  constraint prepaid_ledger_reversal_shape_check
    check (
      (kind = 'reversal' and reversal_of_entry_id is not null and reversal_of_entry_id <> id)
      or (kind <> 'reversal' and reversal_of_entry_id is null)
    ),
  constraint prepaid_ledger_transfer_shape_check
    check (transfer_group_id is null or system_managed),
  constraint prepaid_ledger_kind_sign_check
    check (
      (kind = 'topup' and bucket = 'topup' and signed_amount > 0)
      or (kind = 'debit' and bucket = 'debit' and signed_amount < 0)
      or kind in ('adjustment', 'reversal')
    )
);

create table if not exists public.expenses (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  expense_date date not null,
  category text not null,
  amount bigint not null check (amount >= 0),
  payment_method text not null default '非現金' check (payment_method in ('現金', '非現金')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  stock integer not null default 0 check (stock >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_profiles (
  customer_id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  notes text not null default '',
  formula jsonb not null default '{}'::jsonb check (jsonb_typeof(formula) = 'object'),
  updated_at timestamptz not null default now(),
  constraint crm_profiles_customer_owner_fk
    foreign key (owner_id, customer_id)
    references public.customers(owner_id, id) on delete cascade
);

create table if not exists public.closeouts (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  closeout_date date not null,
  opening_cash bigint not null default 0 check (opening_cash >= 0),
  expected_cash bigint not null default 0,
  counted_cash bigint not null default 0,
  difference bigint not null default 0,
  cash bigint not null default 0,
  transfer bigint not null default 0,
  prepaid_out bigint not null default 0,
  prepaid_in bigint not null default 0,
  cash_prepaid_in bigint not null default 0,
  transfer_prepaid_in bigint not null default 0,
  cash_expenses bigint not null default 0 check (cash_expenses >= 0),
  service_revenue bigint not null default 0,
  expenses bigint not null default 0,
  net_profit bigint not null default 0,
  orders_count integer not null default 0,
  service_orders_count integer not null default 0,
  topup_count integer not null default 0,
  note text not null default '',
  completed_at timestamptz not null default now(),
  primary key (owner_id, closeout_date)
);

create table if not exists public.service_configs (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price bigint not null check (price >= 0),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

-- 同一天可保留多份完整快照，避免較新的壞快照覆蓋可用版本。
create table if not exists public.data_backups (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  backup_date date not null default current_date,
  schema_version integer not null default 1,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  record_counts jsonb not null default '{}'::jsonb check (jsonb_typeof(record_counts) = 'object'),
  integrity jsonb not null default '{}'::jsonb check (jsonb_typeof(integrity) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.customers add column if not exists version bigint not null default 1;
alter table public.customers add column if not exists merged_into_customer_id text;
alter table public.customers add column if not exists archived_at timestamptz;
alter table public.orders add column if not exists version bigint not null default 1;
alter table public.prepaid_ledger add column if not exists reversal_of_entry_id text;
alter table public.prepaid_ledger add column if not exists transfer_group_id text;
alter table public.prepaid_ledger add column if not exists system_managed boolean not null default false;
alter table public.expenses add column if not exists version bigint not null default 1;
alter table public.expenses add column if not exists payment_method text not null default '非現金';
alter table public.inventory add column if not exists version bigint not null default 1;
alter table public.crm_profiles add column if not exists version bigint not null default 1;
alter table public.closeouts add column if not exists version bigint not null default 1;
alter table public.closeouts add column if not exists opening_cash bigint not null default 0;
alter table public.closeouts add column if not exists cash_expenses bigint not null default 0;
alter table public.service_configs add column if not exists version bigint not null default 1;

update public.expenses
set payment_method = '非現金'
where payment_method is null
   or payment_method not in ('現金', '非現金');
update public.closeouts
set opening_cash = coalesce(opening_cash, 0),
    cash_expenses = coalesce(cash_expenses, 0)
where opening_cash is null
   or cash_expenses is null;
alter table public.expenses
  alter column payment_method set default '非現金',
  alter column payment_method set not null;
alter table public.closeouts
  alter column opening_cash set default 0,
  alter column opening_cash set not null,
  alter column cash_expenses set default 0,
  alter column cash_expenses set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.expenses'::regclass
      and conname = 'expenses_payment_method_check'
  ) then
    alter table public.expenses
      add constraint expenses_payment_method_check
      check (payment_method in ('現金', '非現金'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.closeouts'::regclass
      and conname = 'closeouts_opening_cash_check'
  ) then
    alter table public.closeouts
      add constraint closeouts_opening_cash_check check (opening_cash >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.closeouts'::regclass
      and conname = 'closeouts_cash_expenses_check'
  ) then
    alter table public.closeouts
      add constraint closeouts_cash_expenses_check check (cash_expenses >= 0);
  end if;
end $$;

create index if not exists customers_owner_name_idx on public.customers (owner_id, name);
create index if not exists customers_owner_active_name_idx
  on public.customers (owner_id, name) where archived_at is null;
create index if not exists customers_owner_merge_target_idx
  on public.customers (owner_id, merged_into_customer_id) where merged_into_customer_id is not null;
create index if not exists orders_owner_date_idx on public.orders (owner_id, order_date desc);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create unique index if not exists orders_owner_source_event_uidx
  on public.orders (owner_id, source_event_id) where source_event_id is not null;
create unique index if not exists orders_owner_active_calendar_order_uidx
  on public.orders (owner_id, lower(btrim(external_order_id)))
  where source = 'google_calendar'
    and sync_status = 'active'
    and nullif(btrim(external_order_id), '') is not null;
create index if not exists prepaid_ledger_owner_date_idx on public.prepaid_ledger (owner_id, effective_date desc, created_at desc);
create index if not exists prepaid_ledger_customer_id_idx on public.prepaid_ledger (customer_id);
create index if not exists prepaid_ledger_source_order_idx on public.prepaid_ledger (source_order_id) where source_order_id is not null;
create unique index if not exists prepaid_ledger_owner_reversal_once_uidx
  on public.prepaid_ledger (owner_id, reversal_of_entry_id)
  where reversal_of_entry_id is not null;
create index if not exists prepaid_ledger_owner_transfer_group_idx
  on public.prepaid_ledger (owner_id, transfer_group_id)
  where transfer_group_id is not null;
create index if not exists expenses_owner_date_idx on public.expenses (owner_id, expense_date desc);
create index if not exists inventory_owner_name_idx on public.inventory (owner_id, name);
create index if not exists crm_profiles_owner_idx on public.crm_profiles (owner_id);
create index if not exists service_configs_owner_idx on public.service_configs (owner_id);
create index if not exists data_backups_owner_date_idx on public.data_backups (owner_id, backup_date desc);
create index if not exists data_backups_owner_created_idx on public.data_backups (owner_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.bump_row_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.version = old.version + 1;
  return new;
end;
$$;

create or replace function public.prevent_prepaid_ledger_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'prepaid_ledger is append-only; create an adjustment or reversal entry instead';
end;
$$;

create or replace function public.validate_prepaid_ledger_reversal()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  original_entry public.prepaid_ledger%rowtype;
begin
  if new.kind <> 'reversal' then
    return new;
  end if;

  if new.reversal_of_entry_id is null then
    raise exception using errcode = '23514', message = 'reversal_of_entry_id is required for a reversal';
  end if;

  select entry.* into original_entry
  from public.prepaid_ledger entry
  where entry.owner_id = new.owner_id
    and entry.id = new.reversal_of_entry_id
  for key share;

  if not found then
    raise exception using errcode = '23503', message = 'reversal source entry does not exist for this owner';
  end if;

  if original_entry.kind = 'reversal'
    or original_entry.source_order_id is not null
    or original_entry.system_managed
    or original_entry.transfer_group_id is not null then
    raise exception using
      errcode = '23514',
      message = 'reversal source must be a standalone, non-system, non-transfer entry';
  end if;

  if new.source_order_id is not null or new.system_managed or new.transfer_group_id is not null then
    raise exception using
      errcode = '23514',
      message = 'a reversal cannot be order-linked, system-managed, or part of a transfer group';
  end if;

  if new.customer_id is distinct from original_entry.customer_id
    or new.bucket is distinct from original_entry.bucket
    or new.signed_amount::numeric <> -(original_entry.signed_amount::numeric) then
    raise exception using
      errcode = '23514',
      message = 'reversal must keep the original customer and bucket and exactly negate its amount';
  end if;

  return new;
end;
$$;

create or replace function public.validate_prepaid_transfer_group()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  entry_count bigint;
  customer_count bigint;
  signed_total numeric;
  bucket_count bigint;
  effective_date_count bigint;
  null_source_count bigint;
  source_count bigint;
  all_rows_valid boolean;
begin
  if new.transfer_group_id is null then
    return null;
  end if;
  if nullif(btrim(new.transfer_group_id), '') is null then
    raise exception using errcode = '23514', message = 'transfer_group_id cannot be blank';
  end if;

  select
    count(*),
    count(distinct customer_id),
    coalesce(sum(signed_amount), 0),
    count(distinct bucket),
    count(distinct effective_date),
    count(*) filter (where source_order_id is null),
    count(distinct source_order_id),
    coalesce(bool_and(system_managed and kind = 'adjustment'), false)
  into
    entry_count,
    customer_count,
    signed_total,
    bucket_count,
    effective_date_count,
    null_source_count,
    source_count,
    all_rows_valid
  from public.prepaid_ledger
  where owner_id = new.owner_id
    and transfer_group_id = new.transfer_group_id;

  if entry_count <> 2
    or customer_count <> 2
    or signed_total <> 0
    or bucket_count <> 1
    or effective_date_count <> 1
    or not all_rows_valid
    or not (
      null_source_count = entry_count
      or (null_source_count = 0 and source_count = 1)
    ) then
    raise exception using
      errcode = '23514',
      message = 'prepaid transfer group must contain exactly two opposite adjustment entries',
      detail = format('owner_id=%s, transfer_group_id=%s', new.owner_id, new.transfer_group_id);
  end if;

  return null;
end;
$$;

create or replace function public.prevent_data_backup_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'data_backups snapshots cannot be overwritten; insert a new snapshot instead';
end;
$$;

create or replace function public.validate_customer_merge()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_customer public.customers%rowtype;
  cycle_found boolean := false;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.merged_into_customer_id is not distinct from new.merged_into_customer_id then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.merged_into_customer_id is not null then
    raise exception using errcode = '55000', message = 'a completed customer merge is immutable';
  end if;
  if new.merged_into_customer_id is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(new.owner_id::text), 724913);
  if new.merged_into_customer_id = new.id or new.archived_at is null then
    raise exception using errcode = '23514', message = 'merged customer must target another customer and be archived';
  end if;

  select c.* into target_customer
  from public.customers c
  where c.owner_id = new.owner_id and c.id = new.merged_into_customer_id
  for update;
  if not found then
    raise exception using errcode = '23503', message = 'customer merge target does not exist for this owner';
  end if;
  if target_customer.merged_into_customer_id is not null or target_customer.archived_at is not null then
    raise exception using errcode = '55000', message = 'customer merge target must be active and canonical';
  end if;

  with recursive merge_chain(id, next_id, path) as (
    select c.id, c.merged_into_customer_id, array[c.id]
    from public.customers c
    where c.owner_id = new.owner_id and c.id = new.merged_into_customer_id
    union all
    select c.id, c.merged_into_customer_id, chain.path || c.id
    from merge_chain chain
    join public.customers c
      on c.owner_id = new.owner_id and c.id = chain.next_id
    where not c.id = any(chain.path)
  )
  select exists(select 1 from merge_chain where id = new.id or next_id = new.id)
  into cycle_found;
  if cycle_found then
    raise exception using errcode = '23514', message = 'customer merge would create a cycle';
  end if;
  return new;
end;
$$;

create or replace function public.validate_customer_merge_chain()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  cursor_id text;
  next_id text;
  cursor_archived_at timestamptz;
  visited text[] := array[new.id];
begin
  if new.merged_into_customer_id is null then
    return null;
  end if;
  if new.archived_at is null then
    raise exception using errcode = '23514', message = 'merged customer must be archived';
  end if;
  perform pg_advisory_xact_lock(hashtext(new.owner_id::text), 724913);
  cursor_id := new.merged_into_customer_id;
  loop
    if cursor_id = any(visited) then
      raise exception using errcode = '23514', message = 'customer merge would create a cycle';
    end if;
    visited := array_append(visited, cursor_id);
    select c.merged_into_customer_id, c.archived_at
      into next_id, cursor_archived_at
    from public.customers c
    where c.owner_id = new.owner_id and c.id = cursor_id;
    if not found then
      raise exception using errcode = '23503', message = 'customer merge target does not exist for this owner';
    end if;
    if next_id is null then
      if cursor_archived_at is not null then
        raise exception using errcode = '23514', message = 'customer merge chain must end at an active customer';
      end if;
      exit;
    end if;
    cursor_id := next_id;
  end loop;
  return null;
end;
$$;

create or replace function public.enforce_order_closeout_lock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actual_time_only boolean := false;
  locked_update_allowed boolean := false;
  correction_target_date date;
  old_lock_key bigint;
  new_lock_key bigint;
begin
  if tg_op = 'INSERT' then
    new_lock_key := pg_catalog.hashtextextended(new.owner_id::text || '|' || new.order_date::text, 724913);
    perform pg_catalog.pg_advisory_xact_lock(new_lock_key);
  elsif tg_op = 'DELETE' then
    old_lock_key := pg_catalog.hashtextextended(old.owner_id::text || '|' || old.order_date::text, 724913);
    perform pg_catalog.pg_advisory_xact_lock(old_lock_key);
  else
    old_lock_key := pg_catalog.hashtextextended(old.owner_id::text || '|' || old.order_date::text, 724913);
    new_lock_key := pg_catalog.hashtextextended(new.owner_id::text || '|' || new.order_date::text, 724913);
    if old_lock_key = new_lock_key then
      perform pg_catalog.pg_advisory_xact_lock(old_lock_key);
    elsif old_lock_key < new_lock_key then
      perform pg_catalog.pg_advisory_xact_lock(old_lock_key);
      perform pg_catalog.pg_advisory_xact_lock(new_lock_key);
    else
      perform pg_catalog.pg_advisory_xact_lock(new_lock_key);
      perform pg_catalog.pg_advisory_xact_lock(old_lock_key);
    end if;
  end if;

  if tg_op = 'UPDATE' then
    actual_time_only :=
      old.actual_duration_minutes is distinct from new.actual_duration_minutes
      and (to_jsonb(old) - 'actual_duration_minutes' - 'updated_at' - 'version')
          = (to_jsonb(new) - 'actual_duration_minutes' - 'updated_at' - 'version');
    locked_update_allowed := actual_time_only;
  end if;

  if tg_op in ('UPDATE', 'DELETE') and not locked_update_allowed and exists (
    select 1
    from public.closeouts c
    where c.owner_id = old.owner_id
      and c.closeout_date = old.order_date
  ) then
    raise exception using
      errcode = '55000',
      message = format('orders on closed date %s are immutable; add a correction slip', old.order_date);
  end if;

  if tg_op = 'UPDATE' and not locked_update_allowed and exists (
    select 1
    from public.closeouts c
    where c.owner_id = new.owner_id
      and c.closeout_date = new.order_date
  ) then
    raise exception using
      errcode = '55000',
      message = format('cannot move an order into closed date %s; add a correction slip', new.order_date);
  end if;

  if tg_op = 'INSERT' and exists (
       select 1
       from public.closeouts c
       where c.owner_id = new.owner_id
         and c.closeout_date = new.order_date
     ) then
    raise exception using
      errcode = '55000',
      message = format('cannot insert any order on closed date %s; put the correction slip on an open date', new.order_date);
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.correction_slip then
    select o.order_date into correction_target_date
    from public.orders o
    where o.owner_id = new.owner_id
      and o.id = new.correction_for_order_id
      and not o.correction_slip;
    if not found then
      raise exception using errcode = '23503', message = 'correction slip target order does not exist';
    end if;
    if new.correction_for_date is distinct from correction_target_date then
      raise exception using errcode = '23514', message = 'correction_for_date must match the target order date';
    end if;
    if not exists (
      select 1 from public.closeouts c
      where c.owner_id = new.owner_id and c.closeout_date = correction_target_date
    ) then
      raise exception using errcode = '23514', message = 'correction slips may only reference a closed original date';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.lock_closeout_business_date()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  old_lock_key bigint;
  new_lock_key bigint;
begin
  if tg_op = 'INSERT' then
    new_lock_key := pg_catalog.hashtextextended(new.owner_id::text || '|' || new.closeout_date::text, 724913);
    perform pg_catalog.pg_advisory_xact_lock(new_lock_key);
  elsif tg_op = 'DELETE' then
    old_lock_key := pg_catalog.hashtextextended(old.owner_id::text || '|' || old.closeout_date::text, 724913);
    perform pg_catalog.pg_advisory_xact_lock(old_lock_key);
  else
    old_lock_key := pg_catalog.hashtextextended(old.owner_id::text || '|' || old.closeout_date::text, 724913);
    new_lock_key := pg_catalog.hashtextextended(new.owner_id::text || '|' || new.closeout_date::text, 724913);
    if old_lock_key = new_lock_key then
      perform pg_catalog.pg_advisory_xact_lock(old_lock_key);
    elsif old_lock_key < new_lock_key then
      perform pg_catalog.pg_advisory_xact_lock(old_lock_key);
      perform pg_catalog.pg_advisory_xact_lock(new_lock_key);
    else
      perform pg_catalog.pg_advisory_xact_lock(new_lock_key);
      perform pg_catalog.pg_advisory_xact_lock(old_lock_key);
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists customers_validate_merge on public.customers;
create trigger customers_validate_merge
before update on public.customers
for each row execute function public.validate_customer_merge();
drop trigger if exists customers_validate_merge_chain on public.customers;
create constraint trigger customers_validate_merge_chain
after insert or update on public.customers
deferrable initially deferred
for each row execute function public.validate_customer_merge_chain();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();
drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at before update on public.expenses
for each row execute function public.set_updated_at();
drop trigger if exists inventory_set_updated_at on public.inventory;
create trigger inventory_set_updated_at before update on public.inventory
for each row execute function public.set_updated_at();
drop trigger if exists crm_profiles_set_updated_at on public.crm_profiles;
create trigger crm_profiles_set_updated_at before update on public.crm_profiles
for each row execute function public.set_updated_at();
drop trigger if exists service_configs_set_updated_at on public.service_configs;
create trigger service_configs_set_updated_at before update on public.service_configs
for each row execute function public.set_updated_at();

drop trigger if exists prepaid_ledger_append_only on public.prepaid_ledger;
create trigger prepaid_ledger_append_only
before update or delete on public.prepaid_ledger
for each row execute function public.prevent_prepaid_ledger_mutation();

drop trigger if exists prepaid_ledger_validate_reversal on public.prepaid_ledger;
create trigger prepaid_ledger_validate_reversal
before insert on public.prepaid_ledger
for each row execute function public.validate_prepaid_ledger_reversal();

drop trigger if exists prepaid_ledger_validate_transfer_group on public.prepaid_ledger;
create constraint trigger prepaid_ledger_validate_transfer_group
after insert on public.prepaid_ledger
deferrable initially deferred
for each row
when (new.transfer_group_id is not null)
execute function public.validate_prepaid_transfer_group();

drop trigger if exists data_backups_no_update on public.data_backups;
create trigger data_backups_no_update
before update on public.data_backups
for each row execute function public.prevent_data_backup_update();

drop trigger if exists orders_closeout_lock on public.orders;
create trigger orders_closeout_lock
before insert or update or delete on public.orders
for each row execute function public.enforce_order_closeout_lock();

drop trigger if exists closeouts_business_date_lock on public.closeouts;
create trigger closeouts_business_date_lock
before insert or update or delete on public.closeouts
for each row execute function public.lock_closeout_business_date();

drop trigger if exists customers_bump_version on public.customers;
create trigger customers_bump_version before update on public.customers for each row execute function public.bump_row_version();
drop trigger if exists orders_bump_version on public.orders;
create trigger orders_bump_version before update on public.orders for each row execute function public.bump_row_version();
drop trigger if exists expenses_bump_version on public.expenses;
create trigger expenses_bump_version before update on public.expenses for each row execute function public.bump_row_version();
drop trigger if exists inventory_bump_version on public.inventory;
create trigger inventory_bump_version before update on public.inventory for each row execute function public.bump_row_version();
drop trigger if exists crm_profiles_bump_version on public.crm_profiles;
create trigger crm_profiles_bump_version before update on public.crm_profiles for each row execute function public.bump_row_version();
drop trigger if exists closeouts_bump_version on public.closeouts;
create trigger closeouts_bump_version before update on public.closeouts for each row execute function public.bump_row_version();
drop trigger if exists service_configs_bump_version on public.service_configs;
create trigger service_configs_bump_version before update on public.service_configs for each row execute function public.bump_row_version();

create or replace function public.adjust_inventory_stock(p_item_id text, p_delta integer)
returns public.inventory
language plpgsql
security invoker
set search_path = public
as $$
declare changed public.inventory;
begin
  update public.inventory
  set stock = greatest(0, stock + p_delta)
  where id = p_item_id and owner_id = (select auth.uid())
  returning * into changed;
  if changed.id is null then raise exception 'inventory item not found'; end if;
  return changed;
end;
$$;

alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.prepaid_ledger enable row level security;
alter table public.expenses enable row level security;
alter table public.inventory enable row level security;
alter table public.crm_profiles enable row level security;
alter table public.closeouts enable row level security;
alter table public.service_configs enable row level security;
alter table public.data_backups enable row level security;

-- 可修改資料：登入者只能操作自己的列。
drop policy if exists customers_owner_all on public.customers;
create policy customers_owner_all on public.customers for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists orders_owner_all on public.orders;
create policy orders_owner_all on public.orders for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists expenses_owner_all on public.expenses;
create policy expenses_owner_all on public.expenses for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists inventory_owner_all on public.inventory;
create policy inventory_owner_all on public.inventory for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists crm_profiles_owner_all on public.crm_profiles;
create policy crm_profiles_owner_all on public.crm_profiles for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists closeouts_owner_all on public.closeouts;
create policy closeouts_owner_all on public.closeouts for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists service_configs_owner_all on public.service_configs;
create policy service_configs_owner_all on public.service_configs for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists data_backups_owner_all on public.data_backups;
create policy data_backups_owner_all on public.data_backups for all to authenticated
using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- 儲值帳本只允許 SELECT/INSERT，資料庫層禁止 UPDATE/DELETE。
drop policy if exists prepaid_ledger_owner_select on public.prepaid_ledger;
create policy prepaid_ledger_owner_select on public.prepaid_ledger for select to authenticated
using (owner_id = (select auth.uid()));
drop policy if exists prepaid_ledger_owner_insert on public.prepaid_ledger;
create policy prepaid_ledger_owner_insert on public.prepaid_ledger for insert to authenticated
with check (owner_id = (select auth.uid()));

revoke all on public.customers, public.orders, public.prepaid_ledger, public.expenses,
  public.inventory, public.crm_profiles, public.closeouts, public.service_configs, public.data_backups from anon;
grant select, insert, update, delete on public.customers, public.orders, public.expenses,
  public.inventory, public.crm_profiles, public.closeouts, public.service_configs to authenticated;
grant select, insert, delete on public.data_backups to authenticated;
revoke update on public.data_backups from authenticated;
grant select, insert on public.prepaid_ledger to authenticated;
revoke update, delete on public.prepaid_ledger from authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.adjust_inventory_stock(text, integer) to authenticated;

commit;
