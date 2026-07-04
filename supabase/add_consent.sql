-- Migration: add opt-in consent column to user profiles
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS consent_material_partners boolean DEFAULT false;
