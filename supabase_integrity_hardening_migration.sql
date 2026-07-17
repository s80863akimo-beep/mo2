-- momohair integrity hardening
-- Safe to run more than once. Run after all earlier migrations.
begin;

alter table public.customers
  add column if not exists merged_into_customer_id text,
  add column if not exists archived_at timestamptz;

alter table public.prepaid_ledger
  add column if not exists reversal_of_entry_id text,
  add column if not exists transfer_group_id text,
  add column if not exists system_managed boolean not null default false;

-- Financial shapes are symmetric: mixed payments require a valid cash split,
-- every other payment has no cash_amount; top-ups require one explicit channel.
-- V2 names let a rerun preserve a constraint that has already been VALIDATEd.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_cash_amount_shape_v2_check'
  ) then
    alter table public.orders
      add constraint orders_cash_amount_shape_v2_check
      check (
        (payment_method = '現金＋儲值扣款' and amount > 0 and cash_amount is not null and cash_amount > 0 and cash_amount < amount)
        or (payment_method <> '現金＋儲值扣款' and cash_amount is null)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_mixed_payment_v2_check'
  ) then
    alter table public.orders
      add constraint orders_mixed_payment_v2_check
      check (
        payment_method <> '現金＋儲值扣款'
        or (amount > 0 and cash_amount is not null and cash_amount > 0 and cash_amount < amount)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_topup_channel_payment_v2_check'
  ) then
    alter table public.orders
      add constraint orders_topup_channel_payment_v2_check
      check (
        (payment_method = '儲值進帳' and topup_channel in ('現金', '轉帳') and topup_channel is not null)
        or (payment_method <> '儲值進帳' and topup_channel is null)
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_correction_audit_v2_check'
  ) then
    alter table public.orders
      add constraint orders_correction_audit_v2_check
      check (
        (
          not correction_slip
          and correction_for_order_id is null
          and correction_for_date is null
          and correction_reason is null
        )
        or (
          correction_slip
          and correction_for_order_id is not null
          and correction_for_date is not null
          and length(trim(coalesce(correction_reason, ''))) > 0
        )
      ) not valid;
  end if;
end $$;

-- Composite owner/id keys are the parent keys for tenant-consistent foreign keys.
-- Existing global primary keys make these unique indexes safe to add.
create unique index if not exists customers_owner_id_uidx
  on public.customers (owner_id, id);
create unique index if not exists orders_owner_id_uidx
  on public.orders (owner_id, id);
create unique index if not exists prepaid_ledger_owner_id_uidx
  on public.prepaid_ledger (owner_id, id);

create index if not exists customers_owner_active_name_idx
  on public.customers (owner_id, name)
  where archived_at is null;
create index if not exists customers_owner_merge_target_idx
  on public.customers (owner_id, merged_into_customer_id)
  where merged_into_customer_id is not null;

-- Order ID is the accounting identity for active Google Calendar rows. Fail with
-- a repairable diagnostic instead of letting CREATE UNIQUE INDEX fail opaquely.
do $$
declare
  duplicate_record record;
begin
  select
    owner_id,
    lower(btrim(external_order_id)) as normalized_order_id,
    count(*) as duplicate_count
  into duplicate_record
  from public.orders
  where source = 'google_calendar'
    and sync_status = 'active'
    and nullif(btrim(external_order_id), '') is not null
  group by owner_id, lower(btrim(external_order_id))
  having count(*) > 1
  limit 1;

  if found then
    raise exception using
      errcode = '23505',
      message = 'duplicate active Google Calendar Order ID must be repaired before integrity hardening',
      detail = format(
        'owner_id=%s, normalized_order_id=%s, rows=%s',
        duplicate_record.owner_id,
        duplicate_record.normalized_order_id,
        duplicate_record.duplicate_count
      );
  end if;
end $$;

create unique index if not exists orders_owner_active_calendar_order_uidx
  on public.orders (owner_id, lower(btrim(external_order_id)))
  where source = 'google_calendar'
    and sync_status = 'active'
    and nullif(btrim(external_order_id), '') is not null;

do $$
declare
  duplicate_record record;
begin
  select owner_id, reversal_of_entry_id, count(*) as duplicate_count
  into duplicate_record
  from public.prepaid_ledger
  where reversal_of_entry_id is not null
  group by owner_id, reversal_of_entry_id
  having count(*) > 1
  limit 1;

  if found then
    raise exception using
      errcode = '23505',
      message = 'duplicate prepaid-ledger reversal must be repaired before integrity hardening',
      detail = format(
        'owner_id=%s, reversal_of_entry_id=%s, rows=%s',
        duplicate_record.owner_id,
        duplicate_record.reversal_of_entry_id,
        duplicate_record.duplicate_count
      );
  end if;
end $$;

create unique index if not exists prepaid_ledger_owner_reversal_once_uidx
  on public.prepaid_ledger (owner_id, reversal_of_entry_id)
  where reversal_of_entry_id is not null;
create index if not exists prepaid_ledger_owner_transfer_group_idx
  on public.prepaid_ledger (owner_id, transfer_group_id)
  where transfer_group_id is not null;

-- NOT VALID keeps legacy rows online while enforcing every new or changed row.
-- After legacy data is repaired, each constraint can be validated explicitly.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.customers'::regclass
      and conname = 'customers_merge_target_not_self_check'
  ) then
    alter table public.customers
      add constraint customers_merge_target_not_self_check
      check (merged_into_customer_id is null or merged_into_customer_id <> id)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prepaid_ledger'::regclass
      and conname = 'prepaid_ledger_transfer_shape_check'
  ) then
    alter table public.prepaid_ledger
      add constraint prepaid_ledger_transfer_shape_check
      check (transfer_group_id is null or system_managed)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.customers'::regclass
      and conname = 'customers_merge_is_archived_check'
  ) then
    alter table public.customers
      add constraint customers_merge_is_archived_check
      check (merged_into_customer_id is null or archived_at is not null)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.customers'::regclass
      and conname = 'customers_merged_into_owner_fk'
  ) then
    alter table public.customers
      add constraint customers_merged_into_owner_fk
      foreign key (owner_id, merged_into_customer_id)
      references public.customers(owner_id, id)
      on delete restrict
      deferrable initially deferred
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_customer_owner_fk'
  ) then
    alter table public.orders
      add constraint orders_customer_owner_fk
      foreign key (owner_id, customer_id)
      references public.customers(owner_id, id)
      on delete restrict
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_correction_target_owner_fk'
  ) then
    alter table public.orders
      add constraint orders_correction_target_owner_fk
      foreign key (owner_id, correction_for_order_id)
      references public.orders(owner_id, id)
      on delete restrict
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prepaid_ledger'::regclass
      and conname = 'prepaid_ledger_customer_owner_fk'
  ) then
    alter table public.prepaid_ledger
      add constraint prepaid_ledger_customer_owner_fk
      foreign key (owner_id, customer_id)
      references public.customers(owner_id, id)
      on delete restrict
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prepaid_ledger'::regclass
      and conname = 'prepaid_ledger_source_order_owner_fk'
  ) then
    alter table public.prepaid_ledger
      add constraint prepaid_ledger_source_order_owner_fk
      foreign key (owner_id, source_order_id)
      references public.orders(owner_id, id)
      on delete restrict
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prepaid_ledger'::regclass
      and conname = 'prepaid_ledger_reversal_owner_fk'
  ) then
    alter table public.prepaid_ledger
      add constraint prepaid_ledger_reversal_owner_fk
      foreign key (owner_id, reversal_of_entry_id)
      references public.prepaid_ledger(owner_id, id)
      on delete restrict
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prepaid_ledger'::regclass
      and conname = 'prepaid_ledger_reversal_shape_check'
  ) then
    alter table public.prepaid_ledger
      add constraint prepaid_ledger_reversal_shape_check
      check (
        (kind = 'reversal' and reversal_of_entry_id is not null and reversal_of_entry_id <> id)
        or (kind <> 'reversal' and reversal_of_entry_id is null)
      )
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.prepaid_ledger'::regclass
      and conname = 'prepaid_ledger_kind_sign_check'
  ) then
    alter table public.prepaid_ledger
      add constraint prepaid_ledger_kind_sign_check
      check (
        (kind = 'topup' and bucket = 'topup' and signed_amount > 0)
        or (kind = 'debit' and bucket = 'debit' and signed_amount < 0)
        or kind in ('adjustment', 'reversal')
      )
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.crm_profiles'::regclass
      and conname = 'crm_profiles_customer_owner_fk'
  ) then
    alter table public.crm_profiles
      add constraint crm_profiles_customer_owner_fk
      foreign key (owner_id, customer_id)
      references public.customers(owner_id, id)
      on delete cascade
      not valid;
  end if;
end $$;

alter table public.customers
  alter constraint customers_merged_into_owner_fk
  deferrable initially deferred;

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

-- Existing transfer groups must already satisfy the deferred invariant; otherwise
-- report one concrete group and leave the whole migration rolled back.
do $$
declare
  invalid_group record;
begin
  select owner_id, transfer_group_id
  into invalid_group
  from public.prepaid_ledger
  where transfer_group_id is not null
  group by owner_id, transfer_group_id
  having nullif(btrim(transfer_group_id), '') is null
    or count(*) <> 2
    or count(distinct customer_id) <> 2
    or coalesce(sum(signed_amount), 0) <> 0
    or count(distinct bucket) <> 1
    or count(distinct effective_date) <> 1
    or not coalesce(bool_and(system_managed and kind = 'adjustment'), false)
    or not (
      count(*) filter (where source_order_id is null) = count(*)
      or (
        count(*) filter (where source_order_id is null) = 0
        and count(distinct source_order_id) = 1
      )
    )
  limit 1;

  if found then
    raise exception using
      errcode = '23514',
      message = 'invalid prepaid transfer group must be repaired before integrity hardening',
      detail = format(
        'owner_id=%s, transfer_group_id=%s',
        invalid_group.owner_id,
        invalid_group.transfer_group_id
      );
  end if;
end $$;

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

drop trigger if exists customers_validate_merge on public.customers;
create trigger customers_validate_merge
before update on public.customers
for each row execute function public.validate_customer_merge();
drop trigger if exists customers_validate_merge_chain on public.customers;
create constraint trigger customers_validate_merge_chain
after insert or update on public.customers
deferrable initially deferred
for each row execute function public.validate_customer_merge_chain();

drop trigger if exists data_backups_no_update on public.data_backups;
create trigger data_backups_no_update
before update on public.data_backups
for each row execute function public.prevent_data_backup_update();

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

drop trigger if exists orders_closeout_lock on public.orders;
create trigger orders_closeout_lock
before insert or update or delete on public.orders
for each row execute function public.enforce_order_closeout_lock();

drop trigger if exists closeouts_business_date_lock on public.closeouts;
create trigger closeouts_business_date_lock
before insert or update or delete on public.closeouts
for each row execute function public.lock_closeout_business_date();

-- Drop only a unique constraint whose key columns are exactly owner_id + backup_date.
-- This preserves unrelated unique constraints and allows multiple recovery points per day.
do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.data_backups'::regclass
      and c.contype = 'u'
      and (
        select array_agg(a.attname::text order by a.attname::text)
        from unnest(c.conkey) as key_column(attnum)
        join pg_attribute a
          on a.attrelid = c.conrelid
         and a.attnum = key_column.attnum
      ) = array['backup_date', 'owner_id']::text[]
  loop
    execute format(
      'alter table public.data_backups drop constraint %I',
      constraint_record.conname
    );
  end loop;
end $$;

drop index if exists public.data_backups_owner_id_backup_date_idx;
drop index if exists public.data_backups_owner_backup_date_uidx;
create index if not exists data_backups_owner_date_idx
  on public.data_backups (owner_id, backup_date desc);
create index if not exists data_backups_owner_created_idx
  on public.data_backups (owner_id, created_at desc);

grant select, insert, delete on public.data_backups to authenticated;
revoke update on public.data_backups from authenticated;

comment on column public.customers.merged_into_customer_id is 'Canonical customer that owns future CRM and prepaid activity after a merge.';
comment on column public.customers.archived_at is 'Archived customers are retained for audit history and excluded from active customer choices.';
comment on column public.prepaid_ledger.reversal_of_entry_id is 'Original append-only ledger entry reversed by this row; one reversal is allowed per original entry.';
comment on table public.data_backups is 'Immutable recovery snapshots; multiple snapshots per owner and date are allowed.';

commit;

-- Optional after repairing all legacy violations:
-- alter table public.customers validate constraint customers_merge_target_not_self_check;
-- alter table public.customers validate constraint customers_merge_is_archived_check;
-- alter table public.customers validate constraint customers_merged_into_owner_fk;
-- alter table public.orders validate constraint orders_customer_owner_fk;
-- alter table public.orders validate constraint orders_correction_target_owner_fk;
-- alter table public.orders validate constraint orders_cash_amount_shape_v2_check;
-- alter table public.orders validate constraint orders_mixed_payment_v2_check;
-- alter table public.orders validate constraint orders_topup_channel_payment_v2_check;
-- alter table public.orders validate constraint orders_correction_audit_v2_check;
-- alter table public.prepaid_ledger validate constraint prepaid_ledger_customer_owner_fk;
-- alter table public.prepaid_ledger validate constraint prepaid_ledger_source_order_owner_fk;
-- alter table public.prepaid_ledger validate constraint prepaid_ledger_reversal_owner_fk;
-- alter table public.prepaid_ledger validate constraint prepaid_ledger_reversal_shape_check;
-- alter table public.prepaid_ledger validate constraint prepaid_ledger_transfer_shape_check;
-- alter table public.prepaid_ledger validate constraint prepaid_ledger_kind_sign_check;
-- alter table public.crm_profiles validate constraint crm_profiles_customer_owner_fk;
