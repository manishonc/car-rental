'use client';

import React, { useState, useEffect, startTransition, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, X, Trash2, Loader2, ImageIcon, AlertCircle } from 'lucide-react';
import { useBooking } from '../BookingContext';
import { uploadFileAction, getCountriesAction } from '@/app/actions';
import { Driver, Country } from '@/lib/api/types';

interface ValidationErrors {
  [key: string]: string;
}

// Compact floating label input component
function FloatingInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `${label}${required ? ' *' : ''}`}
        disabled={disabled}
        className={`
          h-12 pt-2 
          bg-slate-50/80 border-slate-200/80 
          rounded-xl text-gray-800
          placeholder:text-gray-400 placeholder:text-sm
          focus:bg-white focus:border-blue-400
          transition-all duration-200
          ${error ? 'border-red-400 bg-red-50/50' : ''}
        `}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Compact floating label select component  
function FloatingSelect({
  id,
  label,
  value,
  onValueChange,
  error,
  required = false,
  disabled = false,
  children,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          className={`
            h-12 pt-2
            bg-slate-50/80 border-slate-200/80
            rounded-xl text-gray-800
            focus:bg-white focus:border-blue-400
            transition-all duration-200
            ${error ? 'border-red-400 bg-red-50/50' : ''}
            ${!value ? '[&>span]:text-gray-400 [&>span]:text-sm' : ''}
          `}
        >
          <SelectValue placeholder={placeholder || `${label}${required ? ' *' : ''}`} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Email input with clear button
function EmailInput({
  id,
  value,
  onChange,
  error,
  required = false,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="email"
          id={id}
          value={value}
          onChange={onChange}
          placeholder={`Email${required ? ' *' : ''}`}
          className={`
            h-12 pt-2 pr-10
            bg-blue-50/50 border-blue-200/50
            rounded-xl text-gray-800
            placeholder:text-gray-400 placeholder:text-sm
            focus:bg-white focus:border-blue-400
            transition-all duration-200
            ${error ? 'border-red-400 bg-red-50/50' : ''}
          `}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Date input with label (for date inputs that don't support placeholders)
function FloatingDateInput({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const showDatePicker = isFocused || value;

  const handlePlaceholderClick = () => {
    setIsFocused(true);
    // Small delay to ensure input is rendered before focusing
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.showPicker?.();
    }, 10);
  };

  return (
    <div className="relative">
      {!showDatePicker ? (
        // Placeholder view - looks like a text input
        <div
          onClick={handlePlaceholderClick}
          className={`
            h-12 w-full px-3 flex items-center
            bg-slate-50/80 border border-slate-200/80
            rounded-xl text-gray-400 text-sm
            cursor-pointer
            hover:border-blue-400 hover:bg-white
            transition-all duration-200
            ${error ? 'border-red-400 bg-red-50/50' : ''}
          `}
        >
          {label}{required ? ' *' : ''}
        </div>
      ) : (
        // Date picker view
        <Input
          ref={inputRef}
          type="date"
          id={id}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            h-12
            bg-slate-50/80 border-slate-200/80 
            rounded-xl text-gray-800 text-sm
            focus:bg-white focus:border-blue-400
            transition-all duration-200
            ${error ? 'border-red-400 bg-red-50/50' : ''}
          `}
        />
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

export function DriverDataStep() {
  const { state, dispatch, prevStep, nextStep } = useBooking();
  const {
    drivers,
    orderId,
    uploadingFiles,
    uploadedFiles,
    uploadErrors,
  } = state;

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const data = await getCountriesAction();
        setCountries(data);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const updateDriver = (index: number, field: keyof Driver, value: string) => {
    dispatch({
      type: 'UPDATE_DRIVER',
      payload: { index, field, value },
    });
    // Clear validation error for this field
    setValidationErrors((prev) => {
      const key = `${index}_${field}`;
      if (prev[key]) {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      }
      return prev;
    });
  };

  const addDriver = () => {
    dispatch({ type: 'ADD_DRIVER' });
  };

  const removeDriver = (index: number) => {
    dispatch({ type: 'REMOVE_DRIVER', payload: index });
  };

  const handleFileUpload = async (driverIndex: number, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const uploadKey = `${driverIndex}_${Date.now()}_${i}`;

      // Set uploading state
      dispatch({ type: 'SET_UPLOADING_FILE', payload: { key: uploadKey, uploading: true } });
      dispatch({ type: 'SET_UPLOAD_ERROR', payload: { key: uploadKey, error: null } });

      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const result = await uploadFileAction(formData);

          if (result.error || !result.data) {
            throw new Error(result.error || 'Upload failed');
          }

          const response = result.data;

          // Add to uploaded files
          dispatch({
            type: 'ADD_UPLOADED_FILE',
            payload: { driverIndex, file: { ...response, name: file.name } },
          });

          // Update driver's license_photo array
          const currentPhotos = drivers[driverIndex].license_photo || [];
          dispatch({
            type: 'UPDATE_DRIVER',
            payload: {
              index: driverIndex,
              field: 'license_photo',
              value: [...currentPhotos, response.id.toString()],
            },
          });

          dispatch({ type: 'SET_UPLOADING_FILE', payload: { key: uploadKey, uploading: false } });
        } catch (error) {
          console.error('File upload error:', error);
          dispatch({
            type: 'SET_UPLOAD_ERROR',
            payload: {
              key: uploadKey,
              error: error instanceof Error ? error.message : 'Upload failed',
            },
          });
          dispatch({ type: 'SET_UPLOADING_FILE', payload: { key: uploadKey, uploading: false } });
        }
      });
    }
  };

  const removeUploadedFile = (driverIndex: number, fileIndex: number) => {
    const fileToRemove = uploadedFiles[driverIndex]?.[fileIndex];
    if (fileToRemove) {
      // Remove from uploaded files
      dispatch({
        type: 'REMOVE_UPLOADED_FILE',
        payload: { driverIndex, fileIndex },
      });

      // Remove from driver's license_photo array
      const currentPhotos = drivers[driverIndex].license_photo || [];
      dispatch({
        type: 'UPDATE_DRIVER',
        payload: {
          index: driverIndex,
          field: 'license_photo',
          value: currentPhotos.filter((id) => id !== fileToRemove.id.toString()),
        },
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    drivers.forEach((driver, index) => {
      const requiredFields: (keyof Driver)[] = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'country',
        'city',
        'address',
        'birthday',
        'license_num',
        'license_from',
        'license_to',
      ];

      requiredFields.forEach((field) => {
        const value = driver[field];
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors[`${index}_${field}`] = 'This field is required';
          isValid = false;
        }
      });

      // Email validation
      if (driver.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driver.email)) {
        errors[`${index}_email`] = 'Please enter a valid email';
        isValid = false;
      }

      // Date validations
      if (driver.birthday) {
        const birthDate = new Date(driver.birthday);
        const today = new Date();
        const age = Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) {
          errors[`${index}_birthday`] = 'Driver must be at least 18 years old';
          isValid = false;
        }
      }

      if (driver.license_to) {
        const expDate = new Date(driver.license_to);
        if (expDate < new Date()) {
          errors[`${index}_license_to`] = 'License has expired';
          isValid = false;
        }
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Save to localStorage
    if (orderId) {
      localStorage.setItem(`driverInfo_${orderId}`, JSON.stringify(drivers));
    }

    dispatch({ type: 'SET_MAX_COMPLETED_STEP', payload: 3 });
    nextStep();
  };

  const isAnyUploading = Object.keys(uploadingFiles).length > 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={prevStep} className="rounded-xl">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Vehicle Selection
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {drivers.map((driver, driverIndex) => (
          <div
            key={driverIndex}
            className="bg-white rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden"
          >
            {/* Remove Driver Button */}
            {driverIndex > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10"
                onClick={() => removeDriver(driverIndex)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}

            {/* Section Header */}
            <div className="text-center py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-gray-800">
                {driverIndex === 0 ? 'Head driver' : `Additional Driver ${driverIndex}`}
              </h3>
            </div>

            {/* Personal Information */}
            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              {/* Row 1: First Name, Second Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingInput
                  id={`driver_${driverIndex}_first_name`}
                  label="First Name"
                  value={driver.first_name}
                  onChange={(e) => updateDriver(driverIndex, 'first_name', e.target.value)}
                  error={validationErrors[`${driverIndex}_first_name`]}
                  required
                />
                <FloatingInput
                  id={`driver_${driverIndex}_last_name`}
                  label="Second Name"
                  value={driver.last_name}
                  onChange={(e) => updateDriver(driverIndex, 'last_name', e.target.value)}
                  error={validationErrors[`${driverIndex}_last_name`]}
                  required
                />
              </div>

              {/* Row 2: Email, Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <EmailInput
                  id={`driver_${driverIndex}_email`}
                  value={driver.email}
                  onChange={(e) => updateDriver(driverIndex, 'email', e.target.value)}
                  error={validationErrors[`${driverIndex}_email`]}
                  required
                />
                <FloatingInput
                  id={`driver_${driverIndex}_phone`}
                  label="Phone number"
                  type="tel"
                  value={driver.phone}
                  onChange={(e) => updateDriver(driverIndex, 'phone', e.target.value)}
                  error={validationErrors[`${driverIndex}_phone`]}
                  required
                />
              </div>

              {/* Row 3: Country, City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingSelect
                  id={`driver_${driverIndex}_country`}
                  label="Country"
                  value={driver.country}
                  onValueChange={(value) => updateDriver(driverIndex, 'country', value)}
                  error={validationErrors[`${driverIndex}_country`]}
                  disabled={loadingCountries}
                  placeholder={loadingCountries ? 'Loading...' : 'Country *'}
                  required
                >
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.name}
                    </SelectItem>
                  ))}
                </FloatingSelect>
                <FloatingInput
                  id={`driver_${driverIndex}_city`}
                  label="City"
                  value={driver.city}
                  onChange={(e) => updateDriver(driverIndex, 'city', e.target.value)}
                  error={validationErrors[`${driverIndex}_city`]}
                  required
                />
              </div>

              {/* Row 4: Address, Date of birthday */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FloatingInput
                  id={`driver_${driverIndex}_address`}
                  label="Address"
                  value={driver.address}
                  onChange={(e) => updateDriver(driverIndex, 'address', e.target.value)}
                  error={validationErrors[`${driverIndex}_address`]}
                  required
                />
                <FloatingDateInput
                  id={`driver_${driverIndex}_birthday`}
                  label="Date of birthday"
                  value={driver.birthday}
                  onChange={(e) => updateDriver(driverIndex, 'birthday', e.target.value)}
                  error={validationErrors[`${driverIndex}_birthday`]}
                  required
                />
              </div>
            </div>

            {/* Driver License Section */}
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">
                Driver license
              </h4>

              {/* License Fields - responsive: 1 col mobile, 3 cols desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <FloatingInput
                  id={`driver_${driverIndex}_license_num`}
                  label="Document number"
                  value={driver.license_num}
                  onChange={(e) => updateDriver(driverIndex, 'license_num', e.target.value)}
                  error={validationErrors[`${driverIndex}_license_num`]}
                  required
                />
                <FloatingDateInput
                  id={`driver_${driverIndex}_license_from`}
                  label="Issue date"
                  value={driver.license_from}
                  onChange={(e) => updateDriver(driverIndex, 'license_from', e.target.value)}
                  error={validationErrors[`${driverIndex}_license_from`]}
                  required
                />
                <FloatingDateInput
                  id={`driver_${driverIndex}_license_to`}
                  label="Exp date"
                  value={driver.license_to}
                  onChange={(e) => updateDriver(driverIndex, 'license_to', e.target.value)}
                  error={validationErrors[`${driverIndex}_license_to`]}
                  required
                />
              </div>

              {/* Upload Area - Compact */}
              <div className="flex flex-wrap items-start gap-3 sm:gap-4">
                <label
                  htmlFor={`driver_${driverIndex}_license_photo`}
                  className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200"
                >
                  {Object.keys(uploadingFiles).some((key) =>
                    key.startsWith(`${driverIndex}_`)
                  ) ? (
                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-gray-400" />
                      <span className="text-xs text-gray-400 mt-1">Upload</span>
                    </>
                  )}
                  <Input
                    type="file"
                    id={`driver_${driverIndex}_license_photo`}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(driverIndex, e.target.files)}
                  />
                </label>

                {/* Uploaded Files - Horizontal scroll */}
                {uploadedFiles[driverIndex] && uploadedFiles[driverIndex].length > 0 && (
                  <div className="flex-1 flex gap-3 overflow-x-auto py-1">
                    {uploadedFiles[driverIndex].map((file, fileIndex) => (
                      <div
                        key={`${driverIndex}_${fileIndex}`}
                        className="relative flex-shrink-0 w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group"
                      >
                        {file.url ? (
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeUploadedFile(driverIndex, fileIndex)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Errors */}
              {Object.entries(uploadErrors)
                .filter(([key]) => key.startsWith(`${driverIndex}_`))
                .map(([key, error]) => (
                  <p key={key} className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error}
                  </p>
                ))}
            </div>
          </div>
        ))}
        {/* Add New Driver Button - Part of drivers section */}
        <button
          type="button"
          onClick={addDriver}
          className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-blue-500 font-medium hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add new driver
        </button>

        {/* Continue Button - Standalone action */}
        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={isAnyUploading}
            className="w-full rounded-xl py-6 bg-primary hover:bg-primary/90 text-base font-medium"
          >
            {isAnyUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Continue to Extras
          </Button>
        </div>
      </form>
    </div>
  );
}
