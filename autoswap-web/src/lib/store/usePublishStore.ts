import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Types for each wizard step */
export interface VehicleInfo {
  make: string;
  model: string;
  year: number; // e.g., 2020
  mileage: number; // km
  description?: string;
}

export interface PhotoInfo {
  // URLs (local preview) of uploaded images
  files: File[];
}

export interface PricingInfo {
  price: number; // in Bolivianos (Bs.)
  currency: 'BOB';
}

export interface InspectionRequest {
  requested: boolean;
  notes?: string;
}

export interface PublishState {
  step: number; // 0‑4 (5 steps)
  vehicleInfo?: VehicleInfo;
  photos?: PhotoInfo;
  pricing?: PricingInfo;
  inspection?: InspectionRequest;
}

export interface PublishActions {
  nextStep: () => void;
  prevStep: () => void;
  setVehicleInfo: (data: VehicleInfo) => void;
  setPhotos: (data: PhotoInfo) => void;
  setPricing: (data: PricingInfo) => void;
  setInspection: (data: InspectionRequest) => void;
  reset: () => void;
}

export const usePublishStore = create<PublishState & PublishActions>()(
  persist(
    (set, get) => ({
      step: 0,
      vehicleInfo: undefined,
      photos: undefined,
      pricing: undefined,
      inspection: undefined,
      nextStep: () => set({ step: Math.min(get().step + 1, 4) }),
      prevStep: () => set({ step: Math.max(get().step - 1, 0) }),
      setVehicleInfo: (data) => set({ vehicleInfo: data }),
      setPhotos: (data) => set({ photos: data }),
      setPricing: (data) => set({ pricing: data }),
      setInspection: (data) => set({ inspection: data }),
      reset: () => set({ step: 0, vehicleInfo: undefined, photos: undefined, pricing: undefined, inspection: undefined }),
    }),
    {
      name: 'publish-store', // key in storage
    },
  ),
);
