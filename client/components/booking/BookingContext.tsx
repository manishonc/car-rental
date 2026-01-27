'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Vehicle, Location, Driver, FileUploadResponse } from '@/lib/api/types';
import { CalculatedInsurance } from '@/lib/utils/insurance-calculator';

// Types
export interface SearchDates {
  dateFrom: string;
  timeFrom: string;
  dateTo: string;
  timeTo: string;
}

export interface UploadedFile extends FileUploadResponse {
  name: string;
}

export interface BookingState {
  // Navigation
  currentStep: number;
  maxCompletedStep: number;
  
  // Step 1: Search
  locations: Location[];
  loadingLocations: boolean;
  selectedLocation: string;
  searchDates: SearchDates | null;
  searchError: string | null;
  isSearching: boolean;
  
  // Step 2: Vehicle Selection
  vehicles: Vehicle[] | null;
  selectedVehicle: Vehicle | null;
  
  // Step 3: Order & Driver Info
  orderId: string | null;
  orderError: string | null;
  isCreatingOrder: boolean;
  drivers: Driver[];
  uploadingFiles: Record<string, boolean>;
  uploadedFiles: Record<number, UploadedFile[]>;
  uploadErrors: Record<string, string>;
  
  // Step 4: Extras (Insurance)
  selectedInsurance: number | null;
  calculatedInsurances: CalculatedInsurance[];
  
  // Step 5: Confirmation
  termsAccepted: boolean;
  isUpdatingOrder: boolean;
  isConfirmingOrder: boolean;
  confirmationError: string | null;
  orderConfirmed: boolean;
  paymentMethod: 'card' | 'cash';
}

// Action Types
type BookingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_MAX_COMPLETED_STEP'; payload: number }
  | { type: 'SET_LOCATIONS'; payload: Location[] }
  | { type: 'SET_LOADING_LOCATIONS'; payload: boolean }
  | { type: 'SET_SELECTED_LOCATION'; payload: string }
  | { type: 'SET_SEARCH_DATES'; payload: SearchDates | null }
  | { type: 'SET_SEARCH_ERROR'; payload: string | null }
  | { type: 'SET_IS_SEARCHING'; payload: boolean }
  | { type: 'SET_VEHICLES'; payload: Vehicle[] | null }
  | { type: 'SET_SELECTED_VEHICLE'; payload: Vehicle | null }
  | { type: 'SET_ORDER_ID'; payload: string | null }
  | { type: 'SET_ORDER_ERROR'; payload: string | null }
  | { type: 'SET_IS_CREATING_ORDER'; payload: boolean }
  | { type: 'SET_DRIVERS'; payload: Driver[] }
  | { type: 'UPDATE_DRIVER'; payload: { index: number; field: keyof Driver; value: string | string[] } }
  | { type: 'ADD_DRIVER' }
  | { type: 'REMOVE_DRIVER'; payload: number }
  | { type: 'SET_UPLOADING_FILE'; payload: { key: string; uploading: boolean } }
  | { type: 'SET_UPLOADED_FILES'; payload: Record<number, UploadedFile[]> }
  | { type: 'ADD_UPLOADED_FILE'; payload: { driverIndex: number; file: UploadedFile } }
  | { type: 'REMOVE_UPLOADED_FILE'; payload: { driverIndex: number; fileIndex: number } }
  | { type: 'SET_UPLOAD_ERROR'; payload: { key: string; error: string | null } }
  | { type: 'SET_SELECTED_INSURANCE'; payload: number | null }
  | { type: 'SET_CALCULATED_INSURANCES'; payload: CalculatedInsurance[] }
  | { type: 'SET_TERMS_ACCEPTED'; payload: boolean }
  | { type: 'SET_IS_UPDATING_ORDER'; payload: boolean }
  | { type: 'SET_IS_CONFIRMING_ORDER'; payload: boolean }
  | { type: 'SET_CONFIRMATION_ERROR'; payload: string | null }
  | { type: 'SET_ORDER_CONFIRMED'; payload: boolean }
  | { type: 'SET_PAYMENT_METHOD'; payload: 'card' | 'cash' }
  | { type: 'RESET_BOOKING' }
  | { type: 'START_NEW_SEARCH' };

// Helper to create empty driver
const createEmptyDriver = (): Driver => ({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  country: '',
  zip: '',
  state: '',
  city: '',
  address: '',
  birthday: '',
  license_num: '',
  license_from: '',
  license_to: '',
  license_photo: [],
});

// Initial State
const initialState: BookingState = {
  currentStep: 1,
  maxCompletedStep: 0,
  locations: [],
  loadingLocations: true,
  selectedLocation: '',
  searchDates: null,
  searchError: null,
  isSearching: false,
  vehicles: null,
  selectedVehicle: null,
  orderId: null,
  orderError: null,
  isCreatingOrder: false,
  drivers: [createEmptyDriver()],
  uploadingFiles: {},
  uploadedFiles: {},
  uploadErrors: {},
  selectedInsurance: null,
  calculatedInsurances: [],
  termsAccepted: false,
  isUpdatingOrder: false,
  isConfirmingOrder: false,
  confirmationError: null,
  orderConfirmed: false,
  paymentMethod: 'card',
};

// Reducer
function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'SET_MAX_COMPLETED_STEP':
      return { ...state, maxCompletedStep: Math.max(state.maxCompletedStep, action.payload) };
    
    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload };
    
    case 'SET_LOADING_LOCATIONS':
      return { ...state, loadingLocations: action.payload };
    
    case 'SET_SELECTED_LOCATION':
      return { ...state, selectedLocation: action.payload };
    
    case 'SET_SEARCH_DATES':
      return { ...state, searchDates: action.payload };
    
    case 'SET_SEARCH_ERROR':
      return { ...state, searchError: action.payload };
    
    case 'SET_IS_SEARCHING':
      return { ...state, isSearching: action.payload };
    
    case 'SET_VEHICLES':
      return { ...state, vehicles: action.payload };
    
    case 'SET_SELECTED_VEHICLE':
      return { ...state, selectedVehicle: action.payload };
    
    case 'SET_ORDER_ID':
      return { ...state, orderId: action.payload };
    
    case 'SET_ORDER_ERROR':
      return { ...state, orderError: action.payload };
    
    case 'SET_IS_CREATING_ORDER':
      return { ...state, isCreatingOrder: action.payload };
    
    case 'SET_DRIVERS':
      return { ...state, drivers: action.payload };
    
    case 'UPDATE_DRIVER': {
      const updated = [...state.drivers];
      updated[action.payload.index] = {
        ...updated[action.payload.index],
        [action.payload.field]: action.payload.value,
      };
      return { ...state, drivers: updated };
    }
    
    case 'ADD_DRIVER':
      return { ...state, drivers: [...state.drivers, createEmptyDriver()] };
    
    case 'REMOVE_DRIVER':
      if (state.drivers.length <= 1) return state;
      return {
        ...state,
        drivers: state.drivers.filter((_, i) => i !== action.payload),
      };
    
    case 'SET_UPLOADING_FILE': {
      const newUploadingFiles = { ...state.uploadingFiles };
      if (action.payload.uploading) {
        newUploadingFiles[action.payload.key] = true;
      } else {
        delete newUploadingFiles[action.payload.key];
      }
      return { ...state, uploadingFiles: newUploadingFiles };
    }
    
    case 'SET_UPLOADED_FILES':
      return { ...state, uploadedFiles: action.payload };
    
    case 'ADD_UPLOADED_FILE': {
      const files = state.uploadedFiles[action.payload.driverIndex] || [];
      return {
        ...state,
        uploadedFiles: {
          ...state.uploadedFiles,
          [action.payload.driverIndex]: [...files, action.payload.file],
        },
      };
    }
    
    case 'REMOVE_UPLOADED_FILE': {
      const files = state.uploadedFiles[action.payload.driverIndex] || [];
      const newFiles = files.filter((_, i) => i !== action.payload.fileIndex);
      const newUploadedFiles = { ...state.uploadedFiles };
      if (newFiles.length === 0) {
        delete newUploadedFiles[action.payload.driverIndex];
      } else {
        newUploadedFiles[action.payload.driverIndex] = newFiles;
      }
      return { ...state, uploadedFiles: newUploadedFiles };
    }
    
    case 'SET_UPLOAD_ERROR': {
      const newUploadErrors = { ...state.uploadErrors };
      if (action.payload.error) {
        newUploadErrors[action.payload.key] = action.payload.error;
      } else {
        delete newUploadErrors[action.payload.key];
      }
      return { ...state, uploadErrors: newUploadErrors };
    }
    
    case 'SET_SELECTED_INSURANCE':
      return { ...state, selectedInsurance: action.payload };
    
    case 'SET_CALCULATED_INSURANCES':
      return { ...state, calculatedInsurances: action.payload };
    
    case 'SET_TERMS_ACCEPTED':
      return { ...state, termsAccepted: action.payload };
    
    case 'SET_IS_UPDATING_ORDER':
      return { ...state, isUpdatingOrder: action.payload };
    
    case 'SET_IS_CONFIRMING_ORDER':
      return { ...state, isConfirmingOrder: action.payload };
    
    case 'SET_CONFIRMATION_ERROR':
      return { ...state, confirmationError: action.payload };
    
    case 'SET_ORDER_CONFIRMED':
      return { ...state, orderConfirmed: action.payload };
    
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    
    case 'RESET_BOOKING':
      return {
        ...initialState,
        locations: state.locations,
        loadingLocations: false,
        selectedLocation: state.selectedLocation,
      };
    
    case 'START_NEW_SEARCH':
      // Keep search params but reset order-related state
      return {
        ...state,
        currentStep: 1,
        maxCompletedStep: 0,
        vehicles: null,
        selectedVehicle: null,
        orderId: null,
        orderError: null,
        isCreatingOrder: false,
        drivers: [createEmptyDriver()],
        uploadingFiles: {},
        uploadedFiles: {},
        uploadErrors: {},
        selectedInsurance: null,
        calculatedInsurances: [],
        termsAccepted: false,
        isUpdatingOrder: false,
        isConfirmingOrder: false,
        confirmationError: null,
        orderConfirmed: false,
        paymentMethod: 'card',
      };
    
    default:
      return state;
  }
}

// Context Types
interface BookingContextValue {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  
  // Navigation helpers
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoToStep: (step: number) => boolean;
  
  // Utility functions
  getStepValidation: (step: number) => { isValid: boolean; errors: string[] };
  createEmptyDriver: () => Driver;
}

const BookingContext = createContext<BookingContextValue | null>(null);

// Provider Component
export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  // Determine if a step is accessible
  const canGoToStep = useCallback((step: number): boolean => {
    if (step < 1 || step > 5) return false;
    if (step === 1) return true;
    if (step <= state.currentStep) return true;
    if (step <= state.maxCompletedStep + 1) return true;
    return false;
  }, [state.currentStep, state.maxCompletedStep]);

  // Navigation helpers
  const goToStep = useCallback((step: number) => {
    if (canGoToStep(step)) {
      dispatch({ type: 'SET_STEP', payload: step });
    }
  }, [canGoToStep]);

  const nextStep = useCallback(() => {
    if (state.currentStep < 5) {
      dispatch({ type: 'SET_MAX_COMPLETED_STEP', payload: state.currentStep });
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  }, [state.currentStep]);

  const prevStep = useCallback(() => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep - 1 });
    }
  }, [state.currentStep]);

  // Validation helper
  const getStepValidation = useCallback((step: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!state.searchDates) errors.push('Please enter search dates');
        if (!state.selectedLocation) errors.push('Please select a pickup location');
        break;
      
      case 2:
        if (!state.selectedVehicle) errors.push('Please select a vehicle');
        break;
      
      case 3:
        if (state.drivers.length === 0) {
          errors.push('At least one driver is required');
        } else {
          const driver = state.drivers[0];
          if (!driver.first_name) errors.push('First name is required');
          if (!driver.last_name) errors.push('Last name is required');
          if (!driver.email) errors.push('Email is required');
          if (!driver.phone) errors.push('Phone is required');
          if (!driver.country) errors.push('Country is required');
          if (!driver.city) errors.push('City is required');
          if (!driver.address) errors.push('Address is required');
          if (!driver.birthday) errors.push('Birthday is required');
          if (!driver.license_num) errors.push('License number is required');
          if (!driver.license_from) errors.push('License issue date is required');
          if (!driver.license_to) errors.push('License expiry date is required');
        }
        break;
      
      case 4:
        if (!state.selectedInsurance) errors.push('Please select an insurance option');
        break;
      
      case 5:
        if (!state.termsAccepted) errors.push('Please accept the terms and conditions');
        break;
    }

    return { isValid: errors.length === 0, errors };
  }, [state]);

  // Persist driver info to localStorage when orderId changes
  useEffect(() => {
    if (state.orderId && state.drivers.length > 0) {
      localStorage.setItem(`driverInfo_${state.orderId}`, JSON.stringify(state.drivers));
    }
  }, [state.orderId, state.drivers]);

  // Load driver info from localStorage when orderId is set
  useEffect(() => {
    if (state.orderId) {
      const stored = localStorage.getItem(`driverInfo_${state.orderId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          dispatch({ type: 'SET_DRIVERS', payload: Array.isArray(parsed) ? parsed : [parsed] });
        } catch (e) {
          console.error('Failed to parse stored driver info:', e);
        }
      }
    }
  }, [state.orderId]);

  const value: BookingContextValue = {
    state,
    dispatch,
    goToStep,
    nextStep,
    prevStep,
    canGoToStep,
    getStepValidation,
    createEmptyDriver,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

// Hook to use booking context
export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}

export { createEmptyDriver };
