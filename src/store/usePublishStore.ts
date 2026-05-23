import { create } from 'zustand';

export interface PublishState {
  currentStep: number;
  vehicleInfo: {
    brand: string;
    model: string;
    year: string;
    mileage: string;
    category: string;
    description: string;
  };
  photos: string[]; // Base64 data strings
  price: string; // Price in Bs.
  requiresInspection: boolean;
  inspectionRequested: boolean;
  
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateVehicleInfo: (info: Partial<PublishState['vehicleInfo']>) => void;
  addPhoto: (photoBase64: string) => void;
  removePhoto: (index: number) => void;
  setPrice: (price: string) => void;
  setInspectionRequested: (requested: boolean) => void;
  resetWizard: () => void;
}

const initialVehicleInfo = {
  brand: '',
  model: '',
  year: new Date().getFullYear().toString(),
  mileage: '',
  category: 'Sedan',
  description: '',
};

export const usePublishStore = create<PublishState>((set) => ({
  currentStep: 1,
  vehicleInfo: initialVehicleInfo,
  photos: [],
  price: '',
  requiresInspection: false,
  inspectionRequested: false,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => {
    const next = state.currentStep + 1;
    // Auto-calculate if inspection is mandatory based on price
    const priceNum = parseFloat(state.price) || 0;
    const isMandatory = priceNum >= 140000;
    return { 
      currentStep: next > 5 ? 5 : next,
      requiresInspection: isMandatory,
      // If price >= 140,000 Bs., force inspectionRequested to true
      inspectionRequested: isMandatory ? true : state.inspectionRequested
    };
  }),
  prevStep: () => set((state) => ({ currentStep: state.currentStep - 1 < 1 ? 1 : state.currentStep - 1 })),
  updateVehicleInfo: (info) => set((state) => ({ vehicleInfo: { ...state.vehicleInfo, ...info } })),
  addPhoto: (photo) => set((state) => ({ photos: [...state.photos, photo] })),
  removePhoto: (index) => set((state) => ({ photos: state.photos.filter((_, i) => i !== index) })),
  setPrice: (price) => set((state) => {
    const priceNum = parseFloat(price) || 0;
    const isMandatory = priceNum >= 140000;
    return { 
      price,
      requiresInspection: isMandatory,
      inspectionRequested: isMandatory ? true : state.inspectionRequested
    };
  }),
  setInspectionRequested: (requested) => set((state) => ({ 
    inspectionRequested: state.requiresInspection ? true : requested 
  })),
  resetWizard: () => set({
    currentStep: 1,
    vehicleInfo: initialVehicleInfo,
    photos: [],
    price: '',
    requiresInspection: false,
    inspectionRequested: false,
  }),
}));
