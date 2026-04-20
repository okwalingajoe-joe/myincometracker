-- =====================================================================
-- 003_offline_sync_notes.sql
-- MyIncomeTracker — Offline-first sync notes
-- =====================================================================
-- The offline sync layer uses IndexedDB on the client.
-- Each record gets a device-generated UUID (via crypto.randomUUID())
-- before being written locally, then upserted to Supabase on sync.
--
-- No schema changes are required on Supabase — the `synced` and
-- `deleted` flags live only in the client's IndexedDB and are stripped
-- before records are sent to Supabase.
--
-- The upsert strategy uses onConflict: "id" so re-sending the same
-- record is always safe (idempotent).
--
-- To support offline deletes cleanly, ensure your RLS policies allow
-- the authenticated user to DELETE their own rows (already set in 001).
-- =====================================================================

-- Optional: add an index on created_at for faster recent-record queries
create index if not exists daily_income_created_at_idx on public.daily_income(user_id, created_at desc);
create index if not exists giving_created_at_idx on public.giving(user_id, created_at desc);
create index if not exists income_streams_month_idx on public.income_streams(user_id, year, month);
create index if not exists assets_created_at_idx on public.assets(user_id, created_at desc);
create index if not exists liabilities_created_at_idx on public.liabilities(user_id, created_at desc);
create index if not exists investments_created_at_idx on public.investments(user_id, created_at desc);
