begin;

alter table public.customers add column if not exists version bigint not null default 1;
alter table public.orders add column if not exists version bigint not null default 1;
alter table public.expenses add column if not exists version bigint not null default 1;
alter table public.inventory add column if not exists version bigint not null default 1;
alter table public.crm_profiles add column if not exists version bigint not null default 1;
alter table public.closeouts add column if not exists version bigint not null default 1;
alter table public.service_configs add column if not exists version bigint not null default 1;

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

create trigger customers_bump_version before update on public.customers
for each row execute function public.bump_row_version();
create trigger orders_bump_version before update on public.orders
for each row execute function public.bump_row_version();
create trigger expenses_bump_version before update on public.expenses
for each row execute function public.bump_row_version();
create trigger inventory_bump_version before update on public.inventory
for each row execute function public.bump_row_version();
create trigger crm_profiles_bump_version before update on public.crm_profiles
for each row execute function public.bump_row_version();
create trigger closeouts_bump_version before update on public.closeouts
for each row execute function public.bump_row_version();
create trigger service_configs_bump_version before update on public.service_configs
for each row execute function public.bump_row_version();

create or replace function public.adjust_inventory_stock(p_item_id text, p_delta integer)
returns public.inventory
language plpgsql
security invoker
set search_path = public
as $$
declare
  changed public.inventory;
begin
  update public.inventory
  set stock = greatest(0, stock + p_delta)
  where id = p_item_id
    and owner_id = (select auth.uid())
  returning * into changed;

  if changed.id is null then
    raise exception 'inventory item not found';
  end if;
  return changed;
end;
$$;

grant execute on function public.adjust_inventory_stock(text, integer) to authenticated;

commit;
