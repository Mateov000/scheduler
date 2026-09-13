-- ==============================================================================
-- MiMesa Scheduler v1.1 - Supabase Database Schema
-- Strict Privacy: LOCAL_ONLY_FIELDS (cannabis_consumed, notesEncrypted, etc.)
-- are NEVER stored in this database. Enforces Principle P4.
-- ==============================================================================

-- 1. Table for Synced Events
CREATE TABLE IF NOT EXISTS public.mimesa_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  emoji TEXT,
  start TIMESTAMPTZ NOT NULL,
  duration INT NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  location JSONB NOT NULL DEFAULT '{"type": "casa", "name": "Casa"}'::jsonb,
  weather_sensitivity TEXT NOT NULL DEFAULT 'none',
  contacts JSONB DEFAULT '[]'::jsonb,
  cognitive_load INT NOT NULL DEFAULT 1,
  physical_load INT NOT NULL DEFAULT 0,
  estimated_cost_ars NUMERIC,
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id TEXT NOT NULL,
  local_version INT NOT NULL DEFAULT 1
);

-- 2. Table for Synced Parameters
CREATE TABLE IF NOT EXISTS public.mimesa_params (
  id TEXT PRIMARY KEY DEFAULT 'default',
  params JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table for Synced Contacts
CREATE TABLE IF NOT EXISTS public.mimesa_contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  alias TEXT,
  relationship_type TEXT NOT NULL,
  weekly_hours_goal INT,
  has_private_apartment BOOLEAN DEFAULT FALSE,
  is_sensitive BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) and Public Access for Anon Key (or custom auth)
ALTER TABLE public.mimesa_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mimesa_params ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mimesa_contacts ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write (for local-first multi-device sync)
CREATE POLICY "Allow anon read events" ON public.mimesa_events FOR SELECT USING (true);
CREATE POLICY "Allow anon insert events" ON public.mimesa_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update events" ON public.mimesa_events FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete events" ON public.mimesa_events FOR DELETE USING (true);

CREATE POLICY "Allow anon all params" ON public.mimesa_params FOR ALL USING (true);
CREATE POLICY "Allow anon all contacts" ON public.mimesa_contacts FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mimesa_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mimesa_params;
