import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type VehicleInfo = {
  make: string;
  model: string;
  year: number;
  mileage: number;
  description?: string;
};

type PublishState = {
  step: number;
  vehicleInfo: VehicleInfo;
  photos: string[]; // local URIs from ImagePicker
  priceBs: number;
  inspectionRequested: boolean;
  // actions
  setStep: (s: number) => void;
  setVehicleInfo: (v: VehicleInfo) => void;
  setPhotos: (p: string[]) => void;
  setPrice: (p: number) => void;
  setInspectionRequested: (v: boolean) => void;
  reset: () => void;
};

export const usePublishStore = create<PublishState>()(
  persist(
    (set, get) => ({
      step: 1,
      vehicleInfo: {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        mileage: 0,
        description: '',
      },
      photos: [],
      priceBs: 0,
      inspectionRequested: false,
      setStep: (s) => set({ step: s }),
      setVehicleInfo: (v) => set({ vehicleInfo: v }),
      setPhotos: (p) => set({ photos: p }),
      setPrice: (p) => set({ priceBs: p }),
      setInspectionRequested: (v) => set({ inspectionRequested: v }),
      reset: () =>
        set({
          step: 1,
          vehicleInfo: { make: '', model: '', year: new Date().getFullYear(), mileage: 0, description: '' },
          photos: [],
          priceBs: 0,
          inspectionRequested: false,
        }),
    }),
    {
      name: 'publish-wizard-mobile',
      getStorage: () => AsyncStorage,
    },
  ),
);
