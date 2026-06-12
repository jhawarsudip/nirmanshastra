-- NirmanShastra — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- USERS (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  name text,
  mobile text,
  state text,
  city text,
  plan text DEFAULT 'free', -- free | pro
  created_at timestamptz DEFAULT now()
);

-- CONTACTS (lead capture — saved immediately on registration)
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  mobile text,
  email text,
  address text,
  city text,
  pin_code text,
  state text,
  property_type text,
  plot_size text,
  source text, -- 'VastuPro' | 'StructoPro' | etc.
  status text DEFAULT 'registered', -- registered | analysed | paid | downloaded
  created_at timestamptz DEFAULT now()
);

-- ESTIMATES
CREATE TABLE IF NOT EXISTS public.estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  app_type text, -- 'structopro' | 'masonpro' | 'electropro' | 'plumbpro' | 'interiorpro' | 'vastupro'
  project_name text,
  input_data jsonb,
  result_data jsonb,
  status text DEFAULT 'draft', -- draft | complete | paid
  city text,
  state text,
  created_at timestamptz DEFAULT now()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid REFERENCES public.estimates(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount integer, -- in paise (49900 = ₹499)
  status text DEFAULT 'pending', -- pending | success | failed
  created_at timestamptz DEFAULT now()
);

-- REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid REFERENCES public.estimates(id) ON DELETE SET NULL,
  pdf_url text,
  email_sent boolean DEFAULT false,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- CITY RATES (updated quarterly)
CREATE TABLE IF NOT EXISTS public.city_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text,
  city text,
  zone text,
  cement_rate decimal,       -- per 50kg bag
  brick_rate decimal,        -- per 1000 bricks
  steel_rate decimal,        -- per kg TMT Fe500
  sand_rate decimal,         -- per cft
  aggregate_rate decimal,    -- per cft
  labour_multiplier decimal DEFAULT 1.0,
  last_updated date,
  UNIQUE(state, city, zone)
);

-- EMAIL SEQUENCES
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  sequence_type text, -- 'vastupro' | 'structopro' | etc.
  day_number integer, -- 0, 7, 45, 75, 120
  status text DEFAULT 'pending', -- pending | sent | failed
  scheduled_at timestamptz,
  sent_at timestamptz
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.city_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

-- Users: own row only
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Contacts: own rows only (matched by user email or user_id via estimates)
-- For lead capture before auth, inserts are permitted; reads are own-only
CREATE POLICY "contacts_insert_anon" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "contacts_select_own" ON public.contacts FOR SELECT USING (
  email = (SELECT email FROM public.users WHERE id = auth.uid())
);

-- Estimates: own rows only
CREATE POLICY "estimates_select_own" ON public.estimates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "estimates_insert_own" ON public.estimates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "estimates_update_own" ON public.estimates FOR UPDATE USING (auth.uid() = user_id);

-- Payments: own rows only
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reports: accessible if user owns the linked estimate
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.estimates e
    WHERE e.id = estimate_id AND e.user_id = auth.uid()
  )
);

-- City rates: public read (no user data)
CREATE POLICY "city_rates_select_all" ON public.city_rates FOR SELECT USING (true);

-- Email sequences: own contact rows only
CREATE POLICY "email_sequences_select_own" ON public.email_sequences FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = contact_id
      AND c.email = (SELECT email FROM public.users WHERE id = auth.uid())
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: PUNE CITY RATES (9 zones — launch data)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.city_rates (state, city, zone, cement_rate, brick_rate, steel_rate, sand_rate, aggregate_rate, labour_multiplier, last_updated)
VALUES
  ('Maharashtra', 'Pune', 'Pune Central',         495, 11000, 68, 24, NULL, 1.00, '2026-06-01'),
  ('Maharashtra', 'Pune', 'Kothrud/Karve Nagar',  493, 11000, 68, 24, NULL, 1.01, '2026-06-01'),
  ('Maharashtra', 'Pune', 'Wakad/Hinjewadi',       498, 11000, 69, 25, NULL, 1.03, '2026-06-01'),
  ('Maharashtra', 'Pune', 'Baner/Balewadi',         502, 12000, 69, 25, NULL, 1.05, '2026-06-01'),
  ('Maharashtra', 'Pune', 'Kharadi/Hadapsar',       498, 11000, 68, 26, NULL, 1.04, '2026-06-01'),
  ('Maharashtra', 'Pune', 'Pimpri-Chinchwad',       490, 10000, 67, 23, NULL, 0.96, '2026-06-01'),
  ('Maharashtra', 'Pune', 'Undri/Pisoli/Kondhwa',   500, 11000, 69, 27, NULL, 1.06, '2026-06-01'),
  ('Maharashtra', 'Pune', 'Talegaon',               505, 11000, 70, 28, NULL, 1.12, '2026-06-01'),
  ('Maharashtra', 'Pune', 'Rural Haveli',            488,  9000, 67, 22, NULL, 0.92, '2026-06-01')
ON CONFLICT (state, city, zone) DO NOTHING;
