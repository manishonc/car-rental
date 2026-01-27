'use client';

import React, { useState, useEffect, startTransition, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, X, Trash2, Loader2, ImageIcon, AlertCircle, Check } from 'lucide-react';
import { useBooking } from '../BookingContext';
import { uploadFileAction, getCountriesAction, sendPassAction, verifyContactAction } from '@/app/actions';
import { Driver, Country, ContactDriver } from '@/lib/api/types';

interface ValidationErrors {
  [key: string]: string;
}

type VerificationStep = 'email' | 'code' | 'form';

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
          bg-card border-border 
          rounded-xl text-foreground
          placeholder:text-muted-foreground placeholder:text-sm
          focus:bg-card focus:border-primary/50
          transition-all duration-200
          ${error ? 'border-destructive/50 bg-destructive/5' : ''}
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
            bg-card border-border
            rounded-xl text-foreground
            focus:bg-card focus:border-primary/50
            transition-all duration-200
            ${error ? 'border-destructive/50 bg-destructive/5' : ''}
            ${!value ? '[&>span]:text-muted-foreground [&>span]:text-sm' : ''}
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
            bg-card border border-border
            rounded-xl text-muted-foreground text-sm
            cursor-pointer
            hover:border-primary/50 hover:bg-card
            transition-all duration-200
            ${error ? 'border-destructive/50 bg-destructive/5' : ''}
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
            bg-card border-border 
            rounded-xl text-foreground text-sm
            focus:bg-card focus:border-primary/50
            transition-all duration-200
            ${error ? 'border-destructive/50 bg-destructive/5' : ''}
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

// Email verification input component
function EmailVerificationInput({
  email,
  onEmailChange,
  onClear,
  verified,
  error,
}: {
  email: string;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  verified: boolean;
  error?: string;
}) {
  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="email"
          value={email}
          onChange={onEmailChange}
          placeholder="Email *"
          disabled={verified}
          className={`
            h-12 pt-2 pr-10
            ${verified 
              ? 'bg-blue-50/80 border-blue-300 text-gray-800' 
              : 'bg-slate-50/80 border-slate-200/80 text-gray-800'}
            rounded-xl
            placeholder:text-gray-400 placeholder:text-sm
            focus:bg-white focus:border-blue-400
            transition-all duration-200
            ${error ? 'border-red-400 bg-red-50/50' : ''}
          `}
        />
        {email && (
          <button
            type="button"
            onClick={onClear}
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              verified 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          >
            {verified ? (
              <Check className="w-3 h-3 text-white" />
            ) : (
              <X className="w-3 h-3 text-white" />
            )}
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

  // Email verification state for each driver
  const [verificationSteps, setVerificationSteps] = useState<Map<number, VerificationStep>>(
    new Map([[0, 'email']])
  );
  const [verificationCodes, setVerificationCodes] = useState<Map<number, string>>(new Map());
  const [isVerifying, setIsVerifying] = useState<Map<number, boolean>>(new Map());
  const [verificationErrors, setVerificationErrors] = useState<Map<number, string>>(new Map());
  const [codeSent, setCodeSent] = useState<Map<number, boolean>>(new Map());

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
    // Set initial verification step for new driver
    setVerificationSteps(prev => new Map(prev).set(drivers.length, 'email'));
  };

  const removeDriver = (index: number) => {
    dispatch({ type: 'REMOVE_DRIVER', payload: index });
  };

  // Handle email verification - Step 1: Send pass
  const handleSendPass = async (driverIndex: number) => {
    const email = drivers[driverIndex].email;
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setVerificationErrors(prev => new Map(prev).set(driverIndex, 'Please enter a valid email'));
      return;
    }

    setIsVerifying(prev => new Map(prev).set(driverIndex, true));
    setVerificationErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(driverIndex);
      return newMap;
    });

    try {
      const result = await sendPassAction(email);
      
      if (result.error) {
        setVerificationErrors(prev => new Map(prev).set(driverIndex, result.error!));
        return;
      }

      if (result.send) {
        // User exists, show code input
        setCodeSent(prev => new Map(prev).set(driverIndex, true));
        setVerificationSteps(prev => new Map(prev).set(driverIndex, 'code'));
      } else {
        // User doesn't exist, show full form
        setVerificationSteps(prev => new Map(prev).set(driverIndex, 'form'));
      }
    } catch (error) {
      setVerificationErrors(prev => new Map(prev).set(driverIndex, 'Failed to verify email'));
    } finally {
      setIsVerifying(prev => new Map(prev).set(driverIndex, false));
    }
  };

  // Handle email verification - Step 2: Verify code
  const handleVerifyCode = async (driverIndex: number) => {
    const email = drivers[driverIndex].email;
    const code = verificationCodes.get(driverIndex) || '';

    if (!code.trim()) {
      setVerificationErrors(prev => new Map(prev).set(driverIndex, 'Please enter the verification code'));
      return;
    }

    setIsVerifying(prev => new Map(prev).set(driverIndex, true));
    setVerificationErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(driverIndex);
      return newMap;
    });

    try {
      const result = await verifyContactAction(email, code);
      
      if (result.error || !result.driver) {
        setVerificationErrors(prev => new Map(prev).set(driverIndex, result.error || 'Verification failed'));
        return;
      }

      // Prefill driver data from verified contact
      const contactDriver = result.driver;
      updateDriver(driverIndex, 'first_name', contactDriver.first_name || '');
      updateDriver(driverIndex, 'last_name', contactDriver.last_name || '');
      updateDriver(driverIndex, 'phone', contactDriver.phone || '');
      updateDriver(driverIndex, 'country', contactDriver.country_id || '');
      updateDriver(driverIndex, 'city', contactDriver.city || '');
      updateDriver(driverIndex, 'address', contactDriver.address || '');
      updateDriver(driverIndex, 'birthday', contactDriver.birthday || '');

      // Move to form step
      setVerificationSteps(prev => new Map(prev).set(driverIndex, 'form'));
    } catch (error) {
      setVerificationErrors(prev => new Map(prev).set(driverIndex, 'Verification failed'));
    } finally {
      setIsVerifying(prev => new Map(prev).set(driverIndex, false));
    }
  };

  // Reset email verification
  const handleResetEmail = (driverIndex: number) => {
    updateDriver(driverIndex, 'email', '');
    setVerificationSteps(prev => new Map(prev).set(driverIndex, 'email'));
    setVerificationCodes(prev => {
      const newMap = new Map(prev);
      newMap.delete(driverIndex);
      return newMap;
    });
    setCodeSent(prev => {
      const newMap = new Map(prev);
      newMap.delete(driverIndex);
      return newMap;
    });
    setVerificationErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(driverIndex);
      return newMap;
    });
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
      // Check if driver is in form step
      const step = verificationSteps.get(index) || 'email';
      if (step !== 'form') {
        errors[`${index}_verification`] = 'Please complete email verification';
        isValid = false;
        return;
      }

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
      <form onSubmit={handleSubmit} className="space-y-6">
        {drivers.map((driver, driverIndex) => {
          const currentStep = verificationSteps.get(driverIndex) || 'email';
          const isLoading = isVerifying.get(driverIndex) || false;
          const error = verificationErrors.get(driverIndex);
          const code = verificationCodes.get(driverIndex) || '';
          const hasSentCode = codeSent.get(driverIndex) || false;

          return (
            <div
              key={driverIndex}
              className="bg-card rounded-2xl border border-border relative overflow-hidden"
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
              <div className="text-center py-4 border-b border-border/50">
                <h3 className="text-base font-semibold text-foreground">
                  {driverIndex === 0 ? 'Head driver' : `Additional Driver ${driverIndex}`}
                </h3>
              </div>

              {/* Email Verification Step */}
              {currentStep === 'email' && (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="email"
                        value={driver.email}
                        onChange={(e) => updateDriver(driverIndex, 'email', e.target.value)}
                        placeholder="Email *"
                        className={`
                          h-12 
                          bg-card border-border 
                          rounded-xl text-foreground
                          placeholder:text-muted-foreground placeholder:text-sm
                          focus:bg-card focus:border-primary/50
                          transition-all duration-200
                          ${error ? 'border-destructive/50 bg-destructive/5' : ''}
                        `}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleSendPass(driverIndex)}
                      disabled={isLoading || !driver.email}
                      className="h-12 px-6 rounded-xl"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Next'}
                    </Button>
                  </div>
                  {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                  <p className="text-center text-sm text-muted-foreground">
                    Please add your email to speed up the booking process
                  </p>
                </div>
              )}

              {/* Code Verification Step */}
              {currentStep === 'code' && (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex gap-3">
                    <EmailVerificationInput
                      email={driver.email}
                      onEmailChange={(e) => updateDriver(driverIndex, 'email', e.target.value)}
                      onClear={() => handleResetEmail(driverIndex)}
                      verified={true}
                      error={undefined}
                    />
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={code}
                        onChange={(e) => setVerificationCodes(prev => new Map(prev).set(driverIndex, e.target.value))}
                        placeholder="Code"
                        className="h-12 bg-card border-border rounded-xl text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleVerifyCode(driverIndex)}
                      disabled={isLoading || !code}
                      className="h-12 px-6 rounded-xl"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                    </Button>
                  </div>
                  {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                  <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Code has been sent to e-mail: <span className="text-primary font-medium">{driver.email}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Code not received?{' '}
                      <button
                        type="button"
                        onClick={() => handleSendPass(driverIndex)}
                        disabled={isLoading}
                        className="text-foreground underline hover:text-primary border border-border px-2 py-0.5 rounded text-xs"
                      >
                        Try again
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* Full Form Step */}
              {currentStep === 'form' && (
                <>
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
                      <EmailVerificationInput
                        email={driver.email}
                        onEmailChange={(e) => updateDriver(driverIndex, 'email', e.target.value)}
                        onClear={() => handleResetEmail(driverIndex)}
                        verified={codeSent.get(driverIndex) || false}
                        error={validationErrors[`${driverIndex}_email`]}
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
                    <h4 className="text-sm font-semibold text-foreground mb-4">
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
                        className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                      >
                        {Object.keys(uploadingFiles).some((key) =>
                          key.startsWith(`${driverIndex}_`)
                        ) ? (
                          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-5 h-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground mt-1">Upload</span>
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
                              className="relative flex-shrink-0 w-20 h-20 rounded-xl border border-border overflow-hidden bg-muted/30 group"
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
                                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
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
                </>
              )}
            </div>
          );
        })}
        {/* Add New Driver Button - Part of drivers section */}
        <button
          type="button"
          onClick={addDriver}
          className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-primary font-medium hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 flex items-center justify-center gap-2"
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
