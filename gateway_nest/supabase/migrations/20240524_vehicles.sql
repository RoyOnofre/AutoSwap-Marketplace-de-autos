-- 2024-05-24: Vehicles management schema for AutoSwap Sprint 2
-- Execute this script in your Supabase project (SQL editor or via supabase cli)

-- Enums
CREATE TYPE IF NOT EXISTS public.listing_status AS ENUM ('pending','approved','rejected');
CREATE TYPE IF NOT EXISTS public.vehicle_category AS ENUM ('sedan','suv','hatchback','pickup','van','otro');
CREATE TYPE IF NOT EXISTS public.fuel_type AS ENUM ('gasolina','diesel','electrico','hibrido');
CREATE TYPE IF NOT EXISTS public.transmission_type AS ENUM ('manual','automatico');

-- Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) >= 100),
  make VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  year SMALLINT NOT NULL CHECK (year >= 1990),
  mileage_km INTEGER NOT NULL CHECK (mileage_km >= 0),
  price_clp BIGINT NOT NULL CHECK (price_clp > 0),
  category public.vehicle_category NOT NULL,
  fuel_type public.fuel_type NOT NULL,
  transmission public.transmission_type NOT NULL,
  color_exterior VARCHAR(50),
  license_plate VARCHAR(8) UNIQUE,
  region VARCHAR(80) NOT NULL,
  city VARCHAR(80) NOT NULL,
  validation_status public.listing_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_seller ON public.vehicles (seller_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles (validation_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles (category);
CREATE INDEX IF NOT EXISTS idx_vehicles_region ON public.vehicles (region);
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON public.vehicles (deleted_at) WHERE deleted_at IS NULL;

-- Vehicle photos
CREATE TABLE IF NOT EXISTS public.vehicle_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  angle_label VARCHAR(50) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vehicle features
CREATE TABLE IF NOT EXISTS public.vehicle_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  feature_key VARCHAR(80) NOT NULL,
  feature_label VARCHAR(120) NOT NULL,
  category VARCHAR(60) NOT NULL
);

-- Validation audit log
CREATE TABLE IF NOT EXISTS public.validation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('approved','rejected','reset_to_pending')),
  previous_status public.listing_status NOT NULL,
  new_status public.listing_status NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to keep updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security policies
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
-- Public can read only approved listings
CREATE POLICY public_see_approved ON public.vehicles FOR SELECT TO authenticated, anon USING (validation_status = 'approved' AND deleted_at IS NULL);
-- Sellers can read/write their own listings
CREATE POLICY seller_see_own ON public.vehicles FOR SELECT TO authenticated USING (seller_id = auth.uid() AND deleted_at IS NULL);
CREATE POLICY seller_insert ON public.vehicles FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY seller_update_own ON public.vehicles FOR UPDATE TO authenticated USING (seller_id = auth.uid() AND deleted_at IS NULL) WITH CHECK (seller_id = auth.uid());
-- Admin (service_role) full access
CREATE POLICY admin_full_access ON public.vehicles FOR ALL TO service_role USING (true);

-- RLS for photos (public can see photos of approved vehicles)
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY view_photos_of_approved ON public.vehicle_photos FOR SELECT TO authenticated, anon USING (
  vehicle_id IN (SELECT id FROM public.vehicles WHERE validation_status='approved' AND deleted_at IS NULL)
);
CREATE POLICY seller_manage_photos ON public.vehicle_photos FOR INSERT, DELETE TO authenticated USING (
  vehicle_id IN (SELECT id FROM public.vehicles WHERE seller_id = auth.uid() AND deleted_at IS NULL)
);

-- RLS for audit log (service_role only)
ALTER TABLE public.validation_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_view_log ON public.validation_audit_log FOR SELECT TO service_role USING (true);
CREATE POLICY system_insert_log ON public.validation_audit_log FOR INSERT TO service_role WITH CHECK (true);

-- RPC functions for admin validation workflow
CREATE OR REPLACE FUNCTION public.approve_vehicle(p_vehicle_id UUID, p_admin_id UUID)
RETURNS public.vehicles AS $$
DECLARE v_prev_status public.listing_status; v_updated_vehicle public.vehicles;
BEGIN
  SELECT validation_status INTO v_prev_status FROM public.vehicles WHERE id = p_vehicle_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vehicle % not found', p_vehicle_id USING ERRCODE = 'P0002'; END IF;
  UPDATE public.vehicles SET validation_status = 'approved', reviewed_by = p_admin_id, reviewed_at = now(), updated_at = now() WHERE id = p_vehicle_id RETURNING * INTO v_updated_vehicle;
  INSERT INTO public.validation_audit_log (vehicle_id, admin_id, action, previous_status, new_status, reason) VALUES (p_vehicle_id, p_admin_id, 'approved', v_prev_status, 'approved', NULL);
  RETURN v_updated_vehicle;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.approve_vehicle(UUID, UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reject_vehicle(p_vehicle_id UUID, p_admin_id UUID, p_reason TEXT)
RETURNS public.vehicles AS $$
DECLARE v_prev_status public.listing_status; v_updated_vehicle public.vehicles;
BEGIN
  IF char_length(p_reason) < 20 THEN RAISE EXCEPTION 'Rejection reason must be at least 20 characters' USING ERRCODE = 'P0003'; END IF;
  SELECT validation_status INTO v_prev_status FROM public.vehicles WHERE id = p_vehicle_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vehicle % not found', p_vehicle_id USING ERRCODE = 'P0002'; END IF;
  UPDATE public.vehicles SET validation_status = 'rejected', rejection_reason = p_reason, reviewed_by = p_admin_id, reviewed_at = now(), updated_at = now() WHERE id = p_vehicle_id RETURNING * INTO v_updated_vehicle;
  INSERT INTO public.validation_audit_log (vehicle_id, admin_id, action, previous_status, new_status, reason) VALUES (p_vehicle_id, p_admin_id, 'rejected', v_prev_status, 'rejected', p_reason);
  RETURN v_updated_vehicle;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.reject_vehicle(UUID, UUID, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.reset_to_pending(p_vehicle_id UUID, p_admin_id UUID, p_reason TEXT)
RETURNS public.vehicles AS $$
DECLARE v_prev_status public.listing_status; v_updated_vehicle public.vehicles;
BEGIN
  SELECT validation_status INTO v_prev_status FROM public.vehicles WHERE id = p_vehicle_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vehicle % not found', p_vehicle_id USING ERRCODE = 'P0002'; END IF;
  UPDATE public.vehicles SET validation_status = 'pending', rejection_reason = NULL, reviewed_by = p_admin_id, reviewed_at = now(), updated_at = now() WHERE id = p_vehicle_id RETURNING * INTO v_updated_vehicle;
  INSERT INTO public.validation_audit_log (vehicle_id, admin_id, action, previous_status, new_status, reason) VALUES (p_vehicle_id, p_admin_id, 'reset_to_pending', v_prev_status, 'pending', p_reason);
  RETURN v_updated_vehicle;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.reset_to_pending(UUID, UUID, TEXT) TO authenticated, service_role;

-- End of script
