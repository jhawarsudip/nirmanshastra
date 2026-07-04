-- NirmanShastra — Projects table migration
-- Run this in the Supabase SQL Editor after the initial schema.sql

-- PROJECTS — cross-tool project continuity
CREATE TABLE IF NOT EXISTS public.projects (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  project_name     text        NOT NULL,
  city             text        NOT NULL,
  state            text        NOT NULL,
  num_floors       integer,           -- total floors incl. ground (G=1, G+1=2 …)
  per_floor_areas  jsonb,             -- array of sqft values per floor; null if uniform
  site_condition   text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Add project_id FK to estimates (nullable — existing estimates unaffected)
ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Auto-update updated_at on projects row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
