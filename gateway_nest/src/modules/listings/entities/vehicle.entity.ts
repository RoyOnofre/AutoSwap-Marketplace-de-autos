import { ListingStatus, VehicleCategory, FuelType, TransmissionType } from '../enums/listing-status.enum';

export interface Vehicle {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  make: string;
  model: string;
  year: number;
  mileage_km: number;
  price_clp: number;
  category: VehicleCategory;
  fuel_type: FuelType;
  transmission: TransmissionType;
  color_exterior?: string;
  license_plate?: string;
  region: string;
  city: string;
  validation_status: ListingStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface VehiclePhoto {
  id: string;
  vehicle_id: string;
  storage_path: string;
  angle_label: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface VehicleFeature {
  id: string;
  vehicle_id: string;
  feature_key: string;
  feature_label: string;
  category: string;
}

export interface ValidationAuditLog {
  id: string;
  vehicle_id: string;
  admin_id: string;
  action: 'approved' | 'rejected' | 'reset_to_pending';
  previous_status: ListingStatus;
  new_status: ListingStatus;
  reason?: string;
  created_at: string;
}
