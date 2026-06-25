-- 摸摸頭 momohair Supabase schema v1
-- 在 Supabase Dashboard -> SQL Editor 執行。
-- 所有營運資料都綁定 auth.uid()，anon 無權存取。

begin;

create table if not exists public.customers (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  gender text not null default '女' check (gender in ('女', '男', '其他')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete restrict,
  order_date date not null,
  service_name text not null,
  category text,
  amount bigint not null check (amount >= 0),
  payment_method text not null check (payment_method in ('現金', '轉帳', '儲值扣款', '現金＋儲值扣款', '儲值進帳')),
  cash_amount bigint check (cash_amount is null or cash_amount >= 0),
  topup_channel text check (topup_channel is null or topup_channel in ('現金', '轉帳')),
  source text not null default 'manual',
  source_event_id text,
  external_order_id text,
  sync_status text not null default 'active' check (sync_status in ('active', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (payment_method = '現金＋儲值扣款' or cash_amount is null),
  check (payment_method <> '現金＋儲值扣款' or (cash_amount > 0 and cash_amount < amount)),
  check (payment_method = '儲值進帳' or topup_channel is null)
);

-- append-only：修正與取消都新增 adjustment/reversal，不覆寫舊交易。
create table if not exists public.prepaid_ledger (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  customer_id text not null references public.customers(id) on delete restrict,
  signed_amount bigint not null check (signed_amount <> 0),
  kind text not null check (kind in ('topup', 'debit', 'adjustment', 'reversal')),
  bucket text not null check (bucket in ('topup', 'debit')),
  effective_date date not null,
  source_order_id text,
  service_name text,
  payment_method text,
  note text not null default '',
  customer_name_snapshot text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  expense_date date not null,
  category text not null,
  amount bigint not null check (amount >= 0),
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
  customer_id text primary key references public.customers(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  notes text not null default '',
  formula jsonb not null default '{}'::jsonb check (jsonb_typeof(formula) = 'object'),
  updated_at timestamptz not null default now()
);

create table if not exists public.closeouts (
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  closeout_date date not null,
  expected_cash bigint not null default 0,
  counted_cash bigint not null default 0,
  difference bigint not null default 0,
  service_revenue bigint not null default 0,
  expenses bigint not null default 0,
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

-- 每位使用者每天保留一份完整快照，供誤刪或資料異常時復原。
create table if not exists public.data_backups (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  backup_date date not null default current_date,
  schema_version integer not null default 1,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  record_counts jsonb not null default '{}'::jsonb check (jsonb_typeof(record_counts) = 'object'),
  integrity jsonb not null default '{}'::jsonb check (jsonb_typeof(integrity) = 'object'),
  created_at timestamptz not null default now(),
  unique (owner_id, backup_date)
);

alter table public.customers add column if not exists version bigint not null default 1;
alter table public.orders add column if not exists version bigint not null default 1;
alter table public.expenses add column if not exists version bigint not null default 1;
alter table public.inventory add column if not exists version bigint not null default 1;
alter table public.crm_profiles add column if not exists version bigint not null default 1;
alter table public.closeouts add column if not exists version bigint not null default 1;
alter table public.service_configs add column if not exists version bigint not null default 1;

create index if not exists customers_owner_name_idx on public.customers (owner_id, name);
create index if not exists orders_owner_date_idx on public.orders (owner_id, order_date desc);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create unique index if not exists orders_owner_source_event_uidx
  on public.orders (owner_id, source_event_id) where source_event_id is not null;
create index if not exists prepaid_ledger_owner_date_idx on public.prepaid_ledger (owner_id, effective_date desc, created_at desc);
create index if not exists prepaid_ledger_customer_id_idx on public.prepaid_ledger (customer_id);
create index if not exists prepaid_ledger_source_order_idx on public.prepaid_ledger (source_order_id) where source_order_id is not null;
create index if not exists expenses_owner_date_idx on public.expenses (owner_id, expense_date desc);
create index if not exists inventory_owner_name_idx on public.inventory (owner_id, name);
create index if not exists crm_profiles_owner_idx on public.crm_profiles (owner_id);
create index if not exists service_configs_owner_idx on public.service_configs (owner_id);
create index if not exists data_backups_owner_date_idx on public.data_backups (owner_id, backup_date desc);

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

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();
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
  public.inventory, public.crm_profiles, public.closeouts, public.service_configs, public.data_backups to authenticated;
grant select, insert on public.prepaid_ledger to authenticated;
revoke update, delete on public.prepaid_ledger from authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.adjust_inventory_stock(text, integer) to authenticated;

commit;
