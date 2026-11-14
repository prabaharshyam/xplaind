-- PAY-11, RF-1, AN-1 (2026-11-14, owner decisions).
-- PAY-11: a 7-day week pass at ₹99, full Pro.
-- RF-1: referrals. A learner shares a link; a friend's first pass is 10% off, and when the friend pays
--       the learner who shared gets 7 more days of Pro. Rewarded once per friend; never for yourself.
-- AN-1: funnel counts. One number per event per day, nothing about who: no user id, no device id.

-- PAY-11: the week pass joins the plans.
alter table public.payments drop constraint payments_plan_id_check;
alter table public.payments add constraint payments_plan_id_check check (plan_id in ('pass_week', 'pass_month', 'pass_6month', 'pass_year'));
alter table public.entitlements drop constraint entitlements_plan_id_check;
alter table public.entitlements add constraint entitlements_plan_id_check check (plan_id in ('pass_week', 'pass_month', 'pass_6month', 'pass_year'));

-- RF-1: each learner's share code, made on first use.
create table public.referral_codes (
  user_id uuid primary key references auth.users on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9]{6,12}$'),
  created_at timestamptz not null default now()
);
-- One row per friend who bought with a code: the friend can only ever reward one person, once.
create table public.referrals (
  referred_user uuid primary key references auth.users on delete cascade,
  referrer uuid references auth.users on delete set null,
  order_id text not null references public.payments,
  rewarded_at timestamptz not null default now()
);
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
revoke all on public.referral_codes from public, anon, authenticated;
revoke all on public.referrals from public, anon, authenticated;
create policy "read own code" on public.referral_codes for select to authenticated using (user_id = auth.uid());
grant select on public.referral_codes to authenticated;
-- A learner sees the friends they brought (no names: just that a reward happened, and when).
create policy "read own rewards" on public.referrals for select to authenticated using (referrer = auth.uid());
grant select on public.referrals to authenticated;

alter table public.payments add column referrer uuid references auth.users on delete set null;

-- AN-1: anonymous daily counts.
create table public.funnel_daily (
  day date not null,
  event text not null check (event in ('signup', 'first_lesson', 'ai_trial_used', 'pricing_view', 'checkout_start', 'purchase', 'referral_visit')),
  count int not null default 0,
  primary key (day, event)
);
alter table public.funnel_daily enable row level security;
revoke all on public.funnel_daily from public, anon, authenticated;

create or replace function public.funnel_bump(p_event text, p_day date default (now() at time zone 'Asia/Kolkata')::date)
returns void
language sql
set search_path = ''
as $$
  insert into public.funnel_daily (day, event, count) values (p_day, p_event, 1)
  on conflict (day, event) do update set count = public.funnel_daily.count + 1;
$$;
revoke all on function public.funnel_bump(text, date) from public, anon, authenticated;

-- grant_pass: days for the week pass, the referral reward and the purchase count, in the same
-- transaction as the pass. Everything else is unchanged from 20261113000000_promo_codes.sql.
create or replace function public.grant_pass(p_order text, p_cf_payment text, p_now timestamptz)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_pay public.payments%rowtype;
  v_len interval;
  v_from timestamptz;
begin
  select * into v_pay from public.payments where order_id = p_order for update;
  if not found or v_pay.user_id is null then
    return 'missing';
  end if;
  if v_pay.status = 'paid' then
    return 'already';
  end if;
  if v_pay.promo_code is not null then
    insert into public.promo_redemptions (user_id, code, order_id, redeemed_at)
    values (v_pay.user_id, v_pay.promo_code, p_order, p_now)
    on conflict (user_id, code) do nothing;
    if not found and v_pay.amount_paise = 0 then
      update public.payments set status = 'failed' where order_id = p_order;
      return 'used';
    end if;
  end if;
  v_len := case v_pay.plan_id
    when 'pass_week' then interval '7 days'
    when 'pass_month' then interval '1 month'
    when 'pass_6month' then interval '6 months'
    else interval '12 months' end;
  update public.payments set status = 'paid', paid_at = p_now, cf_payment_id = p_cf_payment where order_id = p_order;
  select greatest(p_now, coalesce((select valid_until from public.entitlements where user_id = v_pay.user_id), p_now)) into v_from;
  insert into public.entitlements as e (user_id, plan_id, valid_until, updated_at)
  values (v_pay.user_id, v_pay.plan_id, v_from + v_len, p_now)
  on conflict (user_id) do update set plan_id = excluded.plan_id, valid_until = excluded.valid_until, updated_at = excluded.updated_at;

  -- RF-1: the first paid pass of a referred friend gives the referrer 7 more days of Pro.
  if v_pay.referrer is not null and v_pay.referrer <> v_pay.user_id then
    insert into public.referrals (referred_user, referrer, order_id, rewarded_at)
    values (v_pay.user_id, v_pay.referrer, p_order, p_now)
    on conflict (referred_user) do nothing;
    if found then
      insert into public.entitlements as e (user_id, plan_id, valid_until, updated_at)
      values (v_pay.referrer, 'pass_week', p_now + interval '7 days', p_now)
      on conflict (user_id) do update set valid_until = greatest(e.valid_until, p_now) + interval '7 days', updated_at = p_now;
    end if;
  end if;

  perform public.funnel_bump('purchase', (p_now at time zone 'Asia/Kolkata')::date);
  return 'granted';
end;
$$;
revoke all on function public.grant_pass(text, text, timestamptz) from public, anon, authenticated;
