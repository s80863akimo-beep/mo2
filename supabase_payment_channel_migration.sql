begin;

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('現金', '轉帳', '儲值扣款', '現金＋儲值扣款', '儲值進帳'));

alter table public.orders add column if not exists topup_channel text;
update public.orders set topup_channel = '現金'
where payment_method = '儲值進帳' and topup_channel is null;

alter table public.orders drop constraint if exists orders_topup_channel_check;
alter table public.orders add constraint orders_topup_channel_check
  check (topup_channel is null or topup_channel in ('現金', '轉帳'));

alter table public.orders drop constraint if exists orders_topup_channel_payment_check;
alter table public.orders add constraint orders_topup_channel_payment_check
  check (payment_method = '儲值進帳' or topup_channel is null);

commit;
