'use client';

import { useActionState, useEffect, useState, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VehicleCard } from '@/components/VehicleCard';
import { Stepper } from '@/components/ui/stepper';
import { searchCars, getLocations, SearchFormState, createOrderAction, uploadFileAction, updateOrderAction, confirmOrderAction } from './actions';
import { Location, Vehicle, Driver, FileUploadResponse } from '@/lib/api/types';
import { Loader2, ArrowLeft, Plus, X, Trash2, Image as ImageIcon, Check } from 'lucide-react';
import { insuranceOptions } from '@/lib/config/insurance';
import { calculateAllInsurancePremiums, CalculatedInsurance } from '@/lib/utils/insurance-calculator';

const initialState: SearchFormState = {
  vehicles: null,
  error: null,
};

const steps = [
  { label: 'Search', description: 'Find available vehicles' },
  { label: 'Select Vehicle', description: 'Choose your car' },
  { label: 'Your data', description: 'Enter your information' },
  { label: 'Extras', description: 'Add extras' },
  { label: 'Confirm Order', description: 'Review and confirm' },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [state, formAction, isPending] = useActionState(searchCars, initialState);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [searchDates, setSearchDates] = useState<{
    dateFrom: string;
    timeFrom: string;
    dateTo: string;
    timeTo: string;
  } | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, Array<FileUploadResponse & { name: string }>>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [selectedInsurance, setSelectedInsurance] = useState<number | null>(null);
  const [calculatedInsurances, setCalculatedInsurances] = useState<CalculatedInsurance[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  useEffect(() => {
    getLocations().then((locs) => {
      setLocations(locs);
      if (locs.length > 0) {
        setSelectedLocation(locs[0].id.toString());
      }
      setLoadingLocations(false);
    });
  }, []);

  // Load driver info from localStorage when orderId is available
  useEffect(() => {
    if (orderId) {
      const stored = localStorage.getItem(`driverInfo_${orderId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Handle both old format (single driver) and new format (array)
          setDrivers(Array.isArray(parsed) ? parsed : parsed ? [parsed] : []);
        } catch (error) {
          console.error('Failed to parse stored driver info:', error);
          setDrivers([]);
        }
      } else {
        // Initialize with one empty driver if none stored
        setDrivers([{
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
        }]);
      }
    } else {
      // Initialize with one empty driver when orderId is not yet available
      setDrivers([{
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
      }]);
    }
  }, [orderId]);

  // Update vehicles state when search completes successfully
  useEffect(() => {
    if (state.vehicles && state.vehicles.length > 0) {
      setVehicles(state.vehicles);
      // Only auto-advance to step 2 if we're on step 1 (new search)
      // Don't auto-advance if we're already on a later step
      if (currentStep === 1) {
        setCurrentStep(2);
      }
    }
  }, [state.vehicles, currentStep]);

  // Calculate insurance premiums when entering Extras step
  useEffect(() => {
    if (currentStep === 4 && drivers.length > 0 && searchDates && drivers[0].birthday && drivers[0].license_from) {
      const headDriver = drivers[0];
      const pickupDate = searchDates.dateFrom;
      const pickupDateTime = new Date(`${searchDates.dateFrom}T${searchDates.timeFrom}`);
      const returnDateTime = new Date(`${searchDates.dateTo}T${searchDates.timeTo}`);
      const rentalDays = Math.ceil((returnDateTime.getTime() - pickupDateTime.getTime()) / (1000 * 60 * 60 * 24));
      
      // calculateAllInsurancePremiums now filters eligible insurances automatically
      const calculated = calculateAllInsurancePremiums(
        insuranceOptions,
        {
          birthday: headDriver.birthday,
          license_from: headDriver.license_from,
          license_to: headDriver.license_to,
          country: headDriver.country,
        },
        pickupDate,
        rentalDays
      );
      
      setCalculatedInsurances(calculated);
      
      // Set default selected insurance (first checked one or first eligible one)
      if (calculated.length > 0) {
        const defaultInsurance = calculated.find(calc => calc.option.checked) || calculated[0];
        if (defaultInsurance) {
          setSelectedInsurance(defaultInsurance.option.id);
        }
      }
    }
  }, [currentStep, drivers, searchDates]);

  // Default dates matching the working curl command
  const defaultPickupDate = new Date('2026-02-16');
  const defaultReturnDate = new Date('2026-02-17');

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Helper function to format dates in "YYYY-MM-DD HH:mm:ss" format
  const formatDateTime = (date: string, time: string): string => {
    // Combine date and time: "YYYY-MM-DD HH:mm:ss"
    return `${date} ${time}:00`;
  };

  const handleBookVehicle = async (vehicle: Vehicle) => {
    if (!searchDates || !selectedLocation) {
      setOrderError('Missing search information. Please search again.');
      return;
    }

    setIsCreatingOrder(true);
    setOrderError(null);
    setSelectedVehicle(vehicle);

    try {
      const dateFrom = formatDateTime(searchDates.dateFrom, searchDates.timeFrom);
      const dateTo = formatDateTime(searchDates.dateTo, searchDates.timeTo);

      const result = await createOrderAction({
        vehicle_id: parseInt(vehicle.id, 10),
        date_from: dateFrom,
        date_to: dateTo,
        pickup_location: parseInt(selectedLocation, 10),
        return_location: parseInt(selectedLocation, 10), // Using same location for return as per current implementation
      });

      if (result.error) {
        setOrderError(result.error);
      } else if (result.orderId) {
        setOrderId(result.orderId);
        setCurrentStep(3);
      } else {
        setOrderError('Order ID not found in response');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      setOrderError(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleStepClick = (step: number) => {
    // Allow navigation to current step and completed steps
    if (step <= currentStep) {
      setCurrentStep(step);
      return;
    }
    
    // If order is created, allow navigation to steps 1-3 (search, vehicle, your data)
    if (orderId && step <= 3) {
      setCurrentStep(step);
      return;
    }
    
    // Allow navigation to step 2 if vehicles are available
    if (step === 2 && vehicles && vehicles.length > 0) {
      setCurrentStep(step);
      return;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // If going back to step 1, reset order-related state for a fresh search
      if (currentStep === 2) {
        setOrderId(null);
        setSelectedVehicle(null);
        setOrderError(null);
        setDrivers([{
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
        }]);
        setSelectedInsurance(null);
        setCalculatedInsurances([]);
        setTermsAccepted(false);
        setUploadedFiles({});
        setUploadErrors({});
      }
      setCurrentStep(currentStep - 1);
    }
  };

  // Step 1: Search
  const renderSearchStep = () => {
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      // Store search dates and locations before submitting
      const dateFrom = formData.get('date_from') as string;
      const timeFrom = formData.get('time_from') as string;
      const dateTo = formData.get('date_to') as string;
      const timeTo = formData.get('time_to') as string;
      
      if (dateFrom && timeFrom && dateTo && timeTo) {
        setSearchDates({ dateFrom, timeFrom, dateTo, timeTo });
      }
      
      // Reset order-related state when performing a new search
      setOrderId(null);
      setSelectedVehicle(null);
      setOrderError(null);
      setDrivers([{
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
      }]);
      setSelectedInsurance(null);
      setCalculatedInsurances([]);
      setTermsAccepted(false);
      setUploadedFiles({});
      setUploadErrors({});
      
      // Call the server action within a transition
      startTransition(() => {
        formAction(formData);
      });
    };

    return (
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_from">Pickup Date</Label>
            <Input
              type="date"
              name="date_from"
              id="date_from"
              defaultValue={formatDate(defaultPickupDate)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time_from">Pickup Time</Label>
            <Input
              type="time"
              name="time_from"
              id="time_from"
              defaultValue="09:15"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_to">Return Date</Label>
            <Input
              type="date"
              name="date_to"
              id="date_to"
              defaultValue={formatDate(defaultReturnDate)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time_to">Return Time</Label>
            <Input
              type="time"
              name="time_to"
              id="time_to"
              defaultValue="09:45"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pickup_location">Pickup Location</Label>
            {loadingLocations ? (
              <div className="h-9 flex items-center px-3 border rounded-md bg-muted text-muted-foreground text-sm">
                Loading locations...
              </div>
            ) : (
              <>
                <input type="hidden" name="pickup_location" value={selectedLocation} />
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>
                        {loc.name} - {loc.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <div className="space-y-2">
            <Label>Drop Location</Label>
            {loadingLocations ? (
              <div className="h-9 flex items-center px-3 border rounded-md bg-muted text-muted-foreground text-sm">
                Loading locations...
              </div>
            ) : (
              <div className="h-9 flex items-center px-3 border rounded-md bg-muted text-muted-foreground text-sm truncate">
                {locations.find(loc => loc.id.toString() === selectedLocation)?.name} - {locations.find(loc => loc.id.toString() === selectedLocation)?.address}
              </div>
            )}
          </div>
        </div>
        {state.error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            {state.error}
          </div>
        )}
        <div className="flex justify-center">
          <Button type="submit" disabled={isPending || loadingLocations} size="lg">
            {isPending && <Loader2 className="animate-spin mr-2" />}
            {isPending ? 'Searching...' : 'Search Available Cars'}
          </Button>
        </div>
      </form>
    </div>
    );
  };

  // Step 2: Vehicle Selection
  const renderVehicleSelectionStep = () => (
    <div className="space-y-6">
      {currentStep > 1 && (
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>
      )}
      {state.error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}
      {vehicles && vehicles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border p-6">
          No vehicles found for the selected dates. Try different dates or locations.
        </div>
      )}
      {vehicles && vehicles.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} available
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard 
                key={vehicle.id} 
                vehicle={vehicle} 
                onBook={handleBookVehicle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Step 3: Your data (Driver Information)
  const renderYourDataStep = () => {
    const addDriver = () => {
      setDrivers([...drivers, {
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
      }]);
    };

    const removeDriver = (index: number) => {
      if (drivers.length > 1) {
        setDrivers(drivers.filter((_, i) => i !== index));
      }
    };

    const updateDriver = (index: number, field: keyof Driver, value: string) => {
      const updated = [...drivers];
      updated[index] = { ...updated[index], [field]: value };
      setDrivers(updated);
    };

    const handleFileUpload = async (driverIndex: number, files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const uploadKey = `${driverIndex}_${i}`;
        
        // Set uploading state
        setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));
        setUploadErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[uploadKey];
          return newErrors;
        });

        startTransition(async () => {
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const result = await uploadFileAction(formData);
            
            if (result.error || !result.data) {
              throw new Error(result.error || 'Upload failed');
            }

            const response = result.data;
            
            // Store file details
            setUploadedFiles(prev => ({
              ...prev,
              [driverIndex]: [...(prev[driverIndex] || []), { ...response, name: file.name }]
            }));

            // Update driver's license_photo array with file ID
            const updated = [...drivers];
            updated[driverIndex] = {
              ...updated[driverIndex],
              license_photo: [...(updated[driverIndex].license_photo || []), response.id.toString()]
            };
            setDrivers(updated);

            // Clear uploading state
            setUploadingFiles(prev => {
              const newState = { ...prev };
              delete newState[uploadKey];
              return newState;
            });
          } catch (error) {
            console.error('File upload error:', error);
            setUploadErrors(prev => ({
              ...prev,
              [uploadKey]: error instanceof Error ? error.message : 'Upload failed'
            }));
            setUploadingFiles(prev => {
              const newState = { ...prev };
              delete newState[uploadKey];
              return newState;
            });
          }
        });
      }
    };

    const removeUploadedFile = (driverIndex: number, fileIndex: number) => {
      // Remove from uploadedFiles state
      setUploadedFiles(prev => {
        const files = prev[driverIndex] || [];
        const newFiles = files.filter((_, i) => i !== fileIndex);
        if (newFiles.length === 0) {
          const newState = { ...prev };
          delete newState[driverIndex];
          return newState;
        }
        return { ...prev, [driverIndex]: newFiles };
      });

      // Remove file ID from driver's license_photo array
      const updated = [...drivers];
      const fileIdToRemove = uploadedFiles[driverIndex]?.[fileIndex]?.id.toString();
      if (fileIdToRemove) {
        updated[driverIndex] = {
          ...updated[driverIndex],
          license_photo: (updated[driverIndex].license_photo || []).filter(id => id !== fileIdToRemove)
        };
        setDrivers(updated);
      }
    };

    const handleDriverFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      const collectedDrivers: Driver[] = drivers.map((driver, index) => {
        return {
          first_name: formData.get(`driver_${index}_first_name`) as string,
          last_name: formData.get(`driver_${index}_last_name`) as string,
          email: formData.get(`driver_${index}_email`) as string,
          phone: formData.get(`driver_${index}_phone`) as string,
          country: formData.get(`driver_${index}_country`) as string,
          zip: '', // Not shown in form but required by API
          state: '', // Not shown in form but required by API
          city: formData.get(`driver_${index}_city`) as string,
          address: formData.get(`driver_${index}_address`) as string,
          birthday: formData.get(`driver_${index}_birthday`) as string,
          license_num: formData.get(`driver_${index}_license_num`) as string,
          license_from: formData.get(`driver_${index}_license_from`) as string,
          license_to: formData.get(`driver_${index}_license_to`) as string,
          license_photo: driver.license_photo || [], // Use uploaded file IDs from state
        };
      });

      setDrivers(collectedDrivers);
      if (orderId) {
        localStorage.setItem(`driverInfo_${orderId}`, JSON.stringify(collectedDrivers));
      }
      setCurrentStep(4);
    };

    return (
      <div className="space-y-6">
        {currentStep > 1 && (
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vehicle Selection
          </Button>
        )}

        {/* Order Creation Status */}
        {isCreatingOrder && (
          <div className="bg-card rounded-xl border shadow-sm p-6">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-5 w-5" />
              <p className="text-muted-foreground">Creating your order...</p>
            </div>
          </div>
        )}

        {orderError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="font-semibold mb-1">Order Creation Failed</p>
            <p>{orderError}</p>
          </div>
        )}

        <form onSubmit={handleDriverFormSubmit} className="space-y-6">
          {drivers.map((driver, driverIndex) => (
            <div key={driverIndex} className="bg-card rounded-xl border shadow-sm p-6 relative">
              {driverIndex > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4"
                  onClick={() => removeDriver(driverIndex)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}

              <h3 className="text-lg font-semibold mb-4">
                {driverIndex === 0 ? 'Head driver' : `Driver ${driverIndex + 1}`}
              </h3>

              {/* Head driver section */}
              <div className="space-y-4 mb-6">
                <h4 className="text-sm font-medium text-muted-foreground">Head driver</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`driver_${driverIndex}_first_name`} className="text-sm">
                      First Name *
                    </Label>
                    <Input
                      type="text"
                      name={`driver_${driverIndex}_first_name`}
                      id={`driver_${driverIndex}_first_name`}
                      value={driver.first_name}
                      onChange={(e) => updateDriver(driverIndex, 'first_name', e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`driver_${driverIndex}_last_name`} className="text-sm">
                      Second Name *
                    </Label>
                    <Input
                      type="text"
                      name={`driver_${driverIndex}_last_name`}
                      id={`driver_${driverIndex}_last_name`}
                      value={driver.last_name}
                      onChange={(e) => updateDriver(driverIndex, 'last_name', e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`driver_${driverIndex}_email`} className="text-sm">
                      Email *
                    </Label>
                    <Input
                      type="email"
                      name={`driver_${driverIndex}_email`}
                      id={`driver_${driverIndex}_email`}
                      value={driver.email}
                      onChange={(e) => updateDriver(driverIndex, 'email', e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`driver_${driverIndex}_phone`} className="text-sm">
                      Phone number *
                    </Label>
                    <Input
                      type="tel"
                      name={`driver_${driverIndex}_phone`}
                      id={`driver_${driverIndex}_phone`}
                      value={driver.phone}
                      onChange={(e) => updateDriver(driverIndex, 'phone', e.target.value)}
                      placeholder="+80999999999"
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`driver_${driverIndex}_country`} className="text-sm">
                      Country *
                    </Label>
                    <Input
                      type="text"
                      name={`driver_${driverIndex}_country`}
                      id={`driver_${driverIndex}_country`}
                      value={driver.country}
                      onChange={(e) => updateDriver(driverIndex, 'country', e.target.value)}
                      placeholder="31"
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`driver_${driverIndex}_city`} className="text-sm">
                      City *
                    </Label>
                    <Input
                      type="text"
                      name={`driver_${driverIndex}_city`}
                      id={`driver_${driverIndex}_city`}
                      value={driver.city}
                      onChange={(e) => updateDriver(driverIndex, 'city', e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor={`driver_${driverIndex}_address`} className="text-sm">
                      Address *
                    </Label>
                    <Input
                      type="text"
                      name={`driver_${driverIndex}_address`}
                      id={`driver_${driverIndex}_address`}
                      value={driver.address}
                      onChange={(e) => updateDriver(driverIndex, 'address', e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`driver_${driverIndex}_birthday`} className="text-sm">
                      Date of birthday *
                    </Label>
                    <Input
                      type="date"
                      name={`driver_${driverIndex}_birthday`}
                      id={`driver_${driverIndex}_birthday`}
                      value={driver.birthday}
                      onChange={(e) => updateDriver(driverIndex, 'birthday', e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Driver license section */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Driver license</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`driver_${driverIndex}_license_num`} className="text-sm">
                      Document number *
                    </Label>
                    <Input
                      type="text"
                      name={`driver_${driverIndex}_license_num`}
                      id={`driver_${driverIndex}_license_num`}
                      value={driver.license_num}
                      onChange={(e) => updateDriver(driverIndex, 'license_num', e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`driver_${driverIndex}_license_from`} className="text-sm">
                      Issue date *
                    </Label>
                    <Input
                      type="date"
                      name={`driver_${driverIndex}_license_from`}
                      id={`driver_${driverIndex}_license_from`}
                      value={driver.license_from}
                      onChange={(e) => updateDriver(driverIndex, 'license_from', e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`driver_${driverIndex}_license_to`} className="text-sm">
                      Exp date *
                    </Label>
                    <Input
                      type="date"
                      name={`driver_${driverIndex}_license_to`}
                      id={`driver_${driverIndex}_license_to`}
                      value={driver.license_to}
                      onChange={(e) => updateDriver(driverIndex, 'license_to', e.target.value)}
                      required
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor={`driver_${driverIndex}_license_photo`} className="text-sm">
                      License Photo
                    </Label>
                    
                    {/* Upload Area */}
                    <label
                      htmlFor={`driver_${driverIndex}_license_photo`}
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors relative"
                    >
                      {Object.keys(uploadingFiles).some(key => key.startsWith(`${driverIndex}_`)) ? (
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="w-8 h-8 text-muted-foreground mb-2 animate-spin" />
                          <p className="text-sm text-muted-foreground">Uploading...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Upload</p>
                        </div>
                      )}
                      <Input
                        type="file"
                        name={`driver_${driverIndex}_license_photo`}
                        id={`driver_${driverIndex}_license_photo`}
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(driverIndex, e.target.files)}
                      />
                    </label>

                    {/* Upload Errors */}
                    {Object.entries(uploadErrors)
                      .filter(([key]) => key.startsWith(`${driverIndex}_`))
                      .map(([key, error]) => (
                        <div key={key} className="text-sm text-destructive mt-1">
                          {error}
                        </div>
                      ))}

                    {/* Uploaded Files Display */}
                    {uploadedFiles[driverIndex] && uploadedFiles[driverIndex].length > 0 && (
                      <div className="mt-3 space-y-2">
                        {uploadedFiles[driverIndex].map((file, fileIndex) => (
                          <div
                            key={`${driverIndex}_${fileIndex}`}
                            className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
                          >
                            {/* Thumbnail */}
                            <div className="flex-shrink-0 w-16 h-16 rounded border overflow-hidden bg-background">
                              {file.url ? (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className="w-full h-full flex items-center justify-center hidden">
                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                              </div>
                            </div>

                            {/* File Details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  ID: {file.id}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                                  {file.status}
                                </span>
                              </div>
                              {file.url && (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline mt-1 block truncate"
                                >
                                  {file.url}
                                </a>
                              )}
                            </div>

                            {/* Remove Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUploadedFile(driverIndex, fileIndex)}
                              className="flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={addDriver}
              className="w-full md:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add new driver
            </Button>

            <div className="flex justify-end">
              <Button type="submit" size="lg">
                Continue to Extras
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  // Step 4: Extras
  const renderExtrasStep = () => {
    const selectedInsuranceData = calculatedInsurances.find(calc => calc.option.id === selectedInsurance);
    const vehicleBasePrice = selectedVehicle ? parseFloat(selectedVehicle.total_price) || 0 : 0;
    const insurancePrice = selectedInsuranceData?.calculatedPrice || 0;
    const totalPrice = vehicleBasePrice + insurancePrice;

    return (
      <div className="space-y-6">
        {currentStep > 1 && (
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Your Data
          </Button>
        )}
        
        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-6">Insurance Options</h2>
          
          {calculatedInsurances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Calculating insurance premiums...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {calculatedInsurances.map((calculated) => {
                const isSelected = selectedInsurance === calculated.option.id;
                const isInvalid = !calculated.factors.isValid;
                
                return (
                  <div
                    key={calculated.option.id}
                    onClick={() => !isInvalid && setSelectedInsurance(calculated.option.id)}
                    className={`
                      border-2 rounded-lg p-4 cursor-pointer transition-all
                      ${isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'}
                      ${isInvalid ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`
                          w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center
                          ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}
                        `}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{calculated.option.title}</h3>
                            {calculated.option.checked && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                Mandatory
                              </span>
                            )}
                            {isInvalid && (
                              <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded">
                                Invalid License
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {calculated.option.deposit === 1 && (
                              <p>Deposit: {calculated.option.deposit_price} {selectedVehicle?.currency || 'CHF'}</p>
                            )}
                            {calculated.option.damage === 1 && (
                              <p>Damage Access: {calculated.option.damage_access} {selectedVehicle?.currency || 'CHF'}</p>
                            )}
                            {calculated.option.price_title && (
                              <p className="text-xs">{calculated.option.price_title}</p>
                            )}
                          </div>
                          {!isInvalid && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <p>Base: {calculated.basePrice.toFixed(2)} {selectedVehicle?.currency || 'CHF'}</p>
                              {(calculated.factors.ageFactor !== 1 || calculated.factors.tenureFactor !== 1 || calculated.factors.countryFactor !== 1) && (
                                <p className="text-xs">
                                  Factors: Age ({calculated.factors.ageFactor.toFixed(2)}x), 
                                  Tenure ({calculated.factors.tenureFactor.toFixed(2)}x), 
                                  Country ({calculated.factors.countryFactor.toFixed(2)}x)
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {calculated.calculatedPrice.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedVehicle?.currency || 'CHF'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedInsuranceData && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Vehicle Base Price:</span>
                <span className="font-semibold">{vehicleBasePrice.toFixed(2)} {selectedVehicle?.currency || 'CHF'}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Insurance:</span>
                <span className="font-semibold">{insurancePrice.toFixed(2)} {selectedVehicle?.currency || 'CHF'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold">{totalPrice.toFixed(2)} {selectedVehicle?.currency || 'CHF'}</span>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => {
                if (selectedInsurance) {
                  setCurrentStep(5);
                }
              }}
              disabled={!selectedInsurance || calculatedInsurances.find(calc => calc.option.id === selectedInsurance)?.factors.isValid === false}
              size="lg"
            >
              Continue to Confirm Order
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Step 5: Confirm Order
  const renderConfirmOrderStep = () => {
    const selectedInsuranceData = calculatedInsurances.find(calc => calc.option.id === selectedInsurance);
    const vehicleBasePrice = selectedVehicle ? parseFloat(selectedVehicle.total_price) || 0 : 0;
    const insurancePrice = selectedInsuranceData?.calculatedPrice || 0;
    const totalPrice = vehicleBasePrice + insurancePrice;

    const handleConfirmOrder = async () => {
      if (!termsAccepted) {
        setConfirmationError('Please accept the Terms & Conditions to continue');
        return;
      }

      if (!orderId || !selectedInsurance) {
        setConfirmationError('Missing order information');
        return;
      }

      setIsUpdatingOrder(true);
      setConfirmationError(null);

      try {
        // First, update order with insurance
        const updateResult = await updateOrderAction(orderId, selectedInsurance);
        
        if (!updateResult.success) {
          setConfirmationError(updateResult.error || 'Failed to update order with insurance');
          setIsUpdatingOrder(false);
          return;
        }

        // Then, confirm the order
        setIsConfirmingOrder(true);
        const confirmResult = await confirmOrderAction(orderId, drivers, 'card');

        if (!confirmResult.success) {
          setConfirmationError(confirmResult.error || 'Failed to confirm order');
        } else {
          // Success - could redirect to success page or show success message
          alert('Order confirmed successfully!');
        }
      } catch (error) {
        console.error('Order confirmation error:', error);
        setConfirmationError(error instanceof Error ? error.message : 'Failed to confirm order');
      } finally {
        setIsUpdatingOrder(false);
        setIsConfirmingOrder(false);
      }
    };

    return (
      <div className="space-y-6">
        {currentStep > 1 && (
          <Button variant="outline" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Extras
          </Button>
        )}

        <div className="bg-card rounded-xl border shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-6">Confirm Your Order</h2>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Vehicle Information */}
            {selectedVehicle && (
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Vehicle</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vehicle</p>
                    <p className="font-medium">{selectedVehicle.brand} {selectedVehicle.mark}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Group</p>
                    <p className="font-medium">{selectedVehicle.group}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rental Dates */}
            {searchDates && (
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Rental Period</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Pickup</p>
                    <p className="font-medium">
                      {new Date(searchDates.dateFrom).toLocaleDateString()} at {searchDates.timeFrom}
                    </p>
                    {locations.find(loc => loc.id.toString() === selectedLocation) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {locations.find(loc => loc.id.toString() === selectedLocation)?.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Return</p>
                    <p className="font-medium">
                      {new Date(searchDates.dateTo).toLocaleDateString()} at {searchDates.timeTo}
                    </p>
                    {locations.find(loc => loc.id.toString() === selectedLocation) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {locations.find(loc => loc.id.toString() === selectedLocation)?.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Driver Information */}
            {drivers.length > 0 && (
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Driver Information</h3>
                {drivers.map((driver, index) => (
                  <div key={index} className="mb-3 last:mb-0">
                    <p className="font-medium text-sm">
                      {driver.first_name} {driver.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{driver.email}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Insurance Selection */}
            {selectedInsuranceData && (
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Insurance</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{selectedInsuranceData.option.title}</p>
                    {selectedInsuranceData.option.deposit === 1 && (
                      <p className="text-xs text-muted-foreground">
                        Deposit: {selectedInsuranceData.option.deposit_price} {selectedVehicle?.currency || 'CHF'}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold">
                    {selectedInsuranceData.calculatedPrice.toFixed(2)} {selectedVehicle?.currency || 'CHF'}
                  </p>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="bg-muted rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vehicle Base Price:</span>
                  <span className="font-medium">{vehicleBasePrice.toFixed(2)} {selectedVehicle?.currency || 'CHF'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Insurance:</span>
                  <span className="font-medium">{insurancePrice.toFixed(2)} {selectedVehicle?.currency || 'CHF'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>{totalPrice.toFixed(2)} {selectedVehicle?.currency || 'CHF'}</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="terms" className="text-sm cursor-pointer">
                  Yes, I accept the Terms & Conditions
                </label>
              </div>

              {confirmationError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
                  {confirmationError}
                </div>
              )}

              <Button
                onClick={handleConfirmOrder}
                disabled={!termsAccepted || isUpdatingOrder || isConfirmingOrder}
                size="lg"
                className="w-full"
              >
                {(isUpdatingOrder || isConfirmingOrder) && <Loader2 className="animate-spin mr-2" />}
                {isUpdatingOrder
                  ? 'Updating Order...'
                  : isConfirmingOrder
                  ? 'Confirming Order...'
                  : 'Confirm Order'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Car Rental</h1>
          <p className="text-muted-foreground">Find and book your perfect vehicle</p>
        </header>

        <div className="mb-8">
          <Stepper 
            currentStep={currentStep} 
            steps={steps}
            onStepClick={handleStepClick}
            accessibleSteps={
              // If order is created, steps 1-3 are always accessible
              orderId ? [1, 2, 3] :
              // If vehicles are available, step 2 is accessible
              vehicles && vehicles.length > 0 ? [2] : []
            }
          />
        </div>

        <div className="mt-8">
          {currentStep === 1 && renderSearchStep()}
          {currentStep === 2 && renderVehicleSelectionStep()}
          {currentStep === 3 && renderYourDataStep()}
          {currentStep === 4 && renderExtrasStep()}
          {currentStep === 5 && renderConfirmOrderStep()}
        </div>
      </div>
    </div>
  );
}
