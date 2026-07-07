begin;

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

alter table public.data_backups add column if not exists backup_date date not null default current_date;
alter table public.data_backups add column if not exists schema_version integer not null default 1;
alter table public.data_backups add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.data_backups add column if not exists record_counts jsonb not null default '{}'::jsonb;
alter table public.data_backups add column if not exists integrity jsonb not null default '{}'::jsonb;
alter table public.data_backups add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.data_backups'::regclass
      and conname = 'data_backups_owner_id_backup_date_key'
  ) then
    alter table public.data_backups
      add constraint data_backups_owner_id_backup_date_key unique (owner_id, backup_date);
  end if;
end $$;

create index if not exists data_backups_owner_date_idx
  on public.data_backups (owner_id, backup_date desc);

alter table public.data_backups enable row level security;

drop policy if exists data_backups_owner_all on public.data_backups;
create policy data_backups_owner_all on public.data_backups for all to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.data_backups to authenticated;
grant usage, select on all sequences in schema public to authenticated;

commit;
