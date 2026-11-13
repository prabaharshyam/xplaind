-- PAY-9: promo codes for Pro passes (2026-11-13, owner decision). A code takes a percentage off one
-- or more passes. Each account can use a code once; there is no overall cap. A code is used up only
-- when its order is paid (or, at 100% off, granted with no payment), never when checkout is abandoned.
-- Only the server reads codes and writes redemptions; learners can read their own redemptions.

create table public.promo_codes (
  -- Stored in lower case; learners may type it in any case.
  code text primary key check (code = lower(code) and code ~ '^[a-z0-9]{3,32}$'),
  percent_off int not null check (percent_off between 1 and 100),
  plan_ids text[] not null default array['pass_month'],
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.promo_redemptions (
  user_id uuid not null references auth.users on delete cascade,
  code text not null references public.promo_codes,
  order_id text not null references public.payments,
  redeemed_at timestamptz not null default now(),
  primary key (user_id, code)
);

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;
revoke all on public.promo_codes from public, anon, authenticated;
revoke all on public.promo_redemptions from public, anon, authenticated;
create policy "read own redemptions" on public.promo_redemptions for select to authenticated using (user_id = auth.uid());
grant select on public.promo_redemptions to authenticated;

-- The order remembers the code and the discount it was priced with, so confirming a payment can
-- check the amount against the plan price after that discount. A 100% order costs nothing.
alter table public.payments
  add column promo_code text references public.promo_codes,
  add column discount_percent int not null default 0 check (discount_percent between 0 and 100);
alter table public.payments drop constraint payments_amount_paise_check;
alter table public.payments add constraint payments_amount_paise_check check (amount_paise >= 0);

-- grant_pass now also records the redemption, in the same transaction, when an order with a code
-- is granted. Everything else is unchanged from 20261108000000_payments.sql.
create or replace function public.grant_pass(p_order text, p_cf_payment text, p_now timestamptz)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_pay public.payments%rowtype;
  v_months int;
  v_from timestamptz;
begin
  select * into v_pay from public.payments where order_id = p_order for update;
  if not found or v_pay.user_id is null then
    return 'missing';
  end if;
  if v_pay.status = 'paid' then
    return 'already';
  end if;
  -- The code is claimed first, so two orders racing with the same code cannot both use it. A free
  -- (100% off) order whose code this account already used grants nothing. A paid order is still
  -- granted, because the learner has paid.
  if v_pay.promo_code is not null then
    insert into public.promo_redemptions (user_id, code, order_id, redeemed_at)
    values (v_pay.user_id, v_pay.promo_code, p_order, p_now)
    on conflict (user_id, code) do nothing;
    if not found and v_pay.amount_paise = 0 then
      update public.payments set status = 'failed' where order_id = p_order;
      return 'used';
    end if;
  end if;
  v_months := case v_pay.plan_id when 'pass_month' then 1 when 'pass_6month' then 6 else 12 end;
  update public.payments set status = 'paid', paid_at = p_now, cf_payment_id = p_cf_payment where order_id = p_order;
  select greatest(p_now, coalesce((select valid_until from public.entitlements where user_id = v_pay.user_id), p_now)) into v_from;
  insert into public.entitlements as e (user_id, plan_id, valid_until, updated_at)
  values (v_pay.user_id, v_pay.plan_id, v_from + make_interval(months => v_months), p_now)
  on conflict (user_id) do update set plan_id = excluded.plan_id, valid_until = excluded.valid_until, updated_at = excluded.updated_at;
  return 'granted';
end;
$$;

revoke all on function public.grant_pass(text, text, timestamptz) from public, anon, authenticated;

-- The codes themselves are not in this file: the repository is public, so codes are added straight
-- in the database (Supabase SQL editor), for example:
--   insert into public.promo_codes (code, percent_off, plan_ids) values ('mycode', 50, array['pass_month']);
-- Switch one off with: update public.promo_codes set active = false where code = 'mycode';
