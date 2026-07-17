-- momohair cash closeout and expense payment migration
-- Existing expenses default to non-cash so historical closeouts never change silently.
begin;

alter table public.expenses
  add column if not exists payment_method text not null default '非現金';

alter table public.closeouts
  add column if not exists opening_cash bigint not null default 0,
  add column if not exists cash_expenses bigint not null default 0;

-- Repair partially-applied/older schemas before enforcing the final shape.
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
      add constraint closeouts_opening_cash_check
      check (opening_cash >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.closeouts'::regclass
      and conname = 'closeouts_cash_expenses_check'
  ) then
    alter table public.closeouts
      add constraint closeouts_cash_expenses_check
      check (cash_expenses >= 0);
  end if;
end $$;

comment on column public.expenses.payment_method is '現金 means paid from the cash drawer; 非現金 does not reduce closeout cash.';
comment on column public.closeouts.opening_cash is 'Cash float present in the drawer at opening.';
comment on column public.closeouts.cash_expenses is 'Expenses paid from the drawer and deducted from expected closeout cash.';

commit;
