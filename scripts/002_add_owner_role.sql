-- Add is_owner flag + owner visibility across all tables
alter table public.profiles
  add column if not exists is_owner boolean not null default false;

-- Helper function: is the current user marked as owner?
-- SECURITY DEFINER avoids RLS recursion when checked inside policies.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_owner from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Replace select policy on profiles so owners can see everyone
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own_or_owner" on public.profiles
  for select using (auth.uid() = id or public.is_owner());

-- Let owner read every other table too (helpful for admin dashboard later)
drop policy if exists "daily_income_owner_select" on public.daily_income;
create policy "daily_income_owner_select" on public.daily_income
  for select using (auth.uid() = user_id or public.is_owner());

drop policy if exists "giving_owner_select" on public.giving;
create policy "giving_owner_select" on public.giving
  for select using (auth.uid() = user_id or public.is_owner());

drop policy if exists "income_streams_owner_select" on public.income_streams;
create policy "income_streams_owner_select" on public.income_streams
  for select using (auth.uid() = user_id or public.is_owner());

drop policy if exists "assets_owner_select" on public.assets;
create policy "assets_owner_select" on public.assets
  for select using (auth.uid() = user_id or public.is_owner());

drop policy if exists "liabilities_owner_select" on public.liabilities;
create policy "liabilities_owner_select" on public.liabilities
  for select using (auth.uid() = user_id or public.is_owner());

drop policy if exists "investments_owner_select" on public.investments;
create policy "investments_owner_select" on public.investments
  for select using (auth.uid() = user_id or public.is_owner());
