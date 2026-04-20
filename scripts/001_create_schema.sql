-- =====================================================================
-- MyIncomeTracker database schema
-- =====================================================================
-- Creates all tables, RLS policies, and the auto-profile trigger.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE where possible).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES  (one row per signed-up user)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name  text,
  email      text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 2. DAILY INCOME TRACKER (DIT)
-- ---------------------------------------------------------------------
create table if not exists public.daily_income (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  entry_date      date not null default current_date,
  source          text not null,               -- e.g. "Wage", "Gift", "Other"
  source_detail   text,                         -- free-text when source = "Other" or extra note
  amount          numeric(14,2) not null check (amount >= 0),
  payment_method  text not null,               -- "Cash" | "Bank" | "Momo"
  created_at      timestamptz not null default now()
);

alter table public.daily_income enable row level security;

drop policy if exists "daily_income_all_own" on public.daily_income;
create policy "daily_income_all_own" on public.daily_income
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3. GIVING TRACKER
-- ---------------------------------------------------------------------
create table if not exists public.giving (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  entry_date      date not null default current_date,
  category        text not null,               -- "Tithe" | "First-fruit" | "Honor" | "Gift" | "Other"
  category_detail text,
  amount          numeric(14,2) not null check (amount >= 0),
  payment_method  text not null,
  created_at      timestamptz not null default now()
);

alter table public.giving enable row level security;

drop policy if exists "giving_all_own" on public.giving;
create policy "giving_all_own" on public.giving
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4. MONTHLY INCOME STREAMS (MIS)
-- ---------------------------------------------------------------------
create table if not exists public.income_streams (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  month      int  not null check (month between 1 and 12),
  year       int  not null,
  name       text not null,                    -- e.g. "Day Job", "YouTube Channel"
  category   text not null,                    -- "Employment" | "Self Employment" | "Business" | "Investment"
  expected   numeric(14,2) not null default 0 check (expected >= 0),
  received   numeric(14,2) not null default 0 check (received >= 0),
  comment    text,
  created_at timestamptz not null default now()
);

alter table public.income_streams enable row level security;

drop policy if exists "income_streams_all_own" on public.income_streams;
create policy "income_streams_all_own" on public.income_streams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 5. ASSETS & LIABILITIES (for networth calculator)
-- ---------------------------------------------------------------------
create table if not exists public.assets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  value      numeric(14,2) not null default 0 check (value >= 0),
  created_at timestamptz not null default now()
);
alter table public.assets enable row level security;
drop policy if exists "assets_all_own" on public.assets;
create policy "assets_all_own" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.liabilities (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  value      numeric(14,2) not null default 0 check (value >= 0),
  created_at timestamptz not null default now()
);
alter table public.liabilities enable row level security;
drop policy if exists "liabilities_all_own" on public.liabilities;
create policy "liabilities_all_own" on public.liabilities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 6. INVESTMENT TRACKER
-- ---------------------------------------------------------------------
create table if not exists public.investments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,                    -- e.g. "HMC Savings", "Bonds"
  type       text not null,                    -- "Bond" | "Savings" | "Stocks" | "Crypto" | "Real Estate" | "Other"
  amount     numeric(14,2) not null default 0 check (amount >= 0),
  notes      text,
  created_at timestamptz not null default now()
);
alter table public.investments enable row level security;
drop policy if exists "investments_all_own" on public.investments;
create policy "investments_all_own" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 7. AUTO-CREATE PROFILE ON SIGNUP
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
