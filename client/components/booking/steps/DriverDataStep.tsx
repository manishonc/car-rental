'use client';

import React, { useState, useEffect, startTransition, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, X, Trash2, Loader2, ImageIcon, AlertCircle, Check } from 'lucide-react';
import { useBooking } from '../BookingContext';
import { uploadFileAction, getCountriesAction, sendPassAction, verifyContactAction } from '@/app/actions';
import { Driver, Country, ContactDriver } from '@/lib/api/types';
import { Stepper } from '@/components/ui/stepper';
import { bookingSteps } from '../BookingWizard';

interface ValidationErrors {
  [key: string]: string;
}

type VerificationStep = 'email' | 'code' | 'form';

// Input group component matching reference design
function InputGroup({
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
    <div>
      <div className={`input-group rounded-xl px-4 py-3 ${error ? 'border-red-400 bg-red-50/50' : ''}`}>
        <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
          {label}{required ? ' *' : ''}
        </label>
        <Input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder || label}
          disabled={disabled}
          className="h-8 border-0 bg-transparent shadow-none p-0 text-slate-900 font-medium focus-visible:ring-0 placeholder:text-slate-300"
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 px-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Select group component
function SelectGroup({
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
    <div>
      <div className={`input-group rounded-xl px-4 py-3 ${error ? 'border-red-400 bg-red-50/50' : ''}`}>
        <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
          {label}{required ? ' *' : ''}
        </label>
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger
            id={id}
            className="h-8 border-0 bg-transparent shadow-none p-0 text-slate-900 font-medium focus:ring-0"
          >
            <SelectValue placeholder={placeholder || label} />
          </SelectTrigger>
          <SelectContent>{children}</SelectContent>
        </Select>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 px-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Date input group
function DateGroup({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const showDatePicker = isFocused || value;

  const handlePlaceholderClick = () => {
    setIsFocused(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.showPicker?.();
    }, 10);
  };

  return (
    <div>
      <div className={`input-group rounded-xl px-4 py-3 ${error ? 'border-red-400 bg-red-50/50' : ''}`}>
        <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
          {label}{required ? ' *' : ''}
        </label>
        {!showDatePicker ? (
          <div
            onClick={handlePlaceholderClick}
            className="h-8 flex items-center text-slate-300 text-sm cursor-pointer"
          >
            Select date
          </div>
        ) : (
          <Input
            ref={inputRef}
            type="date"
            id={id}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            min={min}
            max={max}
            className="h-8 border-0 bg-transparent shadow-none p-0 text-slate-900 font-medium focus-visible:ring-0"
          />
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 px-1">
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
    <div>
      <div className={`input-group rounded-xl px-4 py-3 relative ${error ? 'border-red-400 bg-red-50/50' : ''} ${verified ? 'border-indigo-300 bg-indigo-50/50' : ''}`}>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
          Email *
        </label>
        <div className="relative">
          <Input
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder="Enter email"
            disabled={verified}
            className="h-8 border-0 bg-transparent shadow-none p-0 pr-8 text-slate-900 font-medium focus-visible:ring-0 placeholder:text-slate-300"
          />
          {email && (
            <button
              type="button"
              onClick={onClear}
              className={`absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                verified
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-300 hover:bg-slate-400'
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
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 px-1">
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
    maxCompletedStep,
  } = state;

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  // Email verification state for each driver
  // Initialize based on whether drivers already have data filled in
  const [verificationSteps, setVerificationSteps] = useState<Map<number, VerificationStep>>(() => {
    const initialSteps = new Map<number, VerificationStep>();
    drivers.forEach((driver, index) => {
      // If driver has essential data filled, assume they completed verification
      const hasData = driver.first_name && driver.last_name && driver.email && driver.phone;
      initialSteps.set(index, hasData ? 'form' : 'email');
    });
    return initialSteps;
  });
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
    setVerificationSteps(prev => new Map(prev).set(drivers.length, 'email'));
  };

  const removeDriver = (index: number) => {
    dispatch({ type: 'REMOVE_DRIVER', payload: index });
  };

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
        setCodeSent(prev => new Map(prev).set(driverIndex, true));
        setVerificationSteps(prev => new Map(prev).set(driverIndex, 'code'));
      } else {
        setVerificationSteps(prev => new Map(prev).set(driverIndex, 'form'));
      }
    } catch (error) {
      setVerificationErrors(prev => new Map(prev).set(driverIndex, 'Failed to verify email'));
    } finally {
      setIsVerifying(prev => new Map(prev).set(driverIndex, false));
    }
  };

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

      const contactDriver = result.driver;
      updateDriver(driverIndex, 'first_name', contactDriver.first_name || '');
      updateDriver(driverIndex, 'last_name', contactDriver.last_name || '');
      updateDriver(driverIndex, 'phone', contactDriver.phone || '');
      updateDriver(driverIndex, 'country', contactDriver.country_id || '');
      updateDriver(driverIndex, 'city', contactDriver.city || '');
      updateDriver(driverIndex, 'address', contactDriver.address || '');
      updateDriver(driverIndex, 'birthday', contactDriver.birthday || '');

      setVerificationSteps(prev => new Map(prev).set(driverIndex, 'form'));
    } catch (error) {
      setVerificationErrors(prev => new Map(prev).set(driverIndex, 'Verification failed'));
    } finally {
      setIsVerifying(prev => new Map(prev).set(driverIndex, false));
    }
  };

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

          dispatch({
            type: 'ADD_UPLOADED_FILE',
            payload: { driverIndex, file: { ...response, name: file.name } },
          });

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
      dispatch({
        type: 'REMOVE_UPLOADED_FILE',
        payload: { driverIndex, fileIndex },
      });

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

      if (driver.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driver.email)) {
        errors[`${index}_email`] = 'Please enter a valid email';
        isValid = false;
      }

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

    if (orderId) {
      localStorage.setItem(`driverInfo_${orderId}`, JSON.stringify(drivers));
    }

    dispatch({ type: 'SET_MAX_COMPLETED_STEP', payload: 3 });
    nextStep();
  };

  const isAnyUploading = Object.keys(uploadingFiles).length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button
            type="button"
            onClick={prevStep}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Driver Details
          </h2>
          <p className="text-slate-500 mt-1">Enter your information to continue</p>
        </div>
        <Stepper
          currentStep={3}
          steps={bookingSteps}
          maxCompletedStep={maxCompletedStep}
        />
      </div>

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
              className="bg-white rounded-[2rem] border border-slate-200 relative overflow-hidden"
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
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <h3 className="text-base font-semibold text-slate-900">
                  {driverIndex === 0 ? 'Head driver' : `Additional Driver ${driverIndex}`}
                </h3>
              </div>

              {/* Email Verification Step */}
              {currentStep === 'email' && (
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full sm:flex-1">
                      <div className="input-group rounded-xl px-4 py-3">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                          Email *
                        </label>
                        <Input
                          type="email"
                          value={driver.email}
                          onChange={(e) => updateDriver(driverIndex, 'email', e.target.value)}
                          placeholder="Enter your email"
                          className={`h-8 border-0 bg-transparent shadow-none p-0 text-slate-900 font-medium focus-visible:ring-0 placeholder:text-slate-300 ${error ? 'text-red-600' : ''}`}
                        />
                      </div>
                    </div>
                    <div className="flex items-end w-full sm:w-auto">
                      <Button
                        type="button"
                        onClick={() => handleSendPass(driverIndex)}
                        disabled={isLoading || !driver.email}
                        className="h-[58px] w-full sm:w-auto px-6 rounded-xl"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Next'}
                      </Button>
                    </div>
                  </div>
                  {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1 px-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                  <p className="text-center text-sm text-slate-400">
                    Please add your email to speed up the booking process
                  </p>
                </div>
              )}

              {/* Code Verification Step */}
              {currentStep === 'code' && (
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col gap-3">
                    {/* Email display row */}
                    <div className="w-full">
                      <EmailVerificationInput
                        email={driver.email}
                        onEmailChange={(e) => updateDriver(driverIndex, 'email', e.target.value)}
                        onClear={() => handleResetEmail(driverIndex)}
                        verified={true}
                        error={undefined}
                      />
                    </div>
                    {/* Code input and button row */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="w-full sm:flex-1">
                        <div className="input-group rounded-xl px-4 py-3">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                            Verification Code *
                          </label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={code}
                            onChange={(e) => setVerificationCodes(prev => new Map(prev).set(driverIndex, e.target.value))}
                            placeholder="Enter 6-digit code"
                            className="h-8 border-0 bg-transparent shadow-none p-0 text-slate-900 font-medium focus-visible:ring-0 placeholder:text-slate-300"
                          />
                        </div>
                      </div>
                      <div className="flex items-end w-full sm:w-auto">
                        <Button
                          type="button"
                          onClick={() => handleVerifyCode(driverIndex)}
                          disabled={isLoading || !code}
                          className="h-[58px] w-full sm:w-auto px-6 rounded-xl"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  {error && (
                    <p className="text-xs text-red-500 flex items-center gap-1 px-1">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                  <div className="text-center space-y-1">
                    <p className="text-sm text-slate-400 break-all">
                      Code has been sent to: <span className="text-indigo-600 font-medium">{driver.email}</span>
                    </p>
                    <p className="text-sm text-slate-400">
                      Code not received?{' '}
                      <button
                        type="button"
                        onClick={() => handleSendPass(driverIndex)}
                        disabled={isLoading}
                        className="text-slate-900 underline hover:text-indigo-600 text-xs"
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
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputGroup
                        id={`driver_${driverIndex}_first_name`}
                        label="First Name"
                        value={driver.first_name}
                        onChange={(e) => updateDriver(driverIndex, 'first_name', e.target.value)}
                        error={validationErrors[`${driverIndex}_first_name`]}
                        required
                      />
                      <InputGroup
                        id={`driver_${driverIndex}_last_name`}
                        label="Last Name"
                        value={driver.last_name}
                        onChange={(e) => updateDriver(driverIndex, 'last_name', e.target.value)}
                        error={validationErrors[`${driverIndex}_last_name`]}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <EmailVerificationInput
                        email={driver.email}
                        onEmailChange={(e) => updateDriver(driverIndex, 'email', e.target.value)}
                        onClear={() => handleResetEmail(driverIndex)}
                        verified={codeSent.get(driverIndex) || false}
                        error={validationErrors[`${driverIndex}_email`]}
                      />
                      <InputGroup
                        id={`driver_${driverIndex}_phone`}
                        label="Phone Number"
                        type="tel"
                        value={driver.phone}
                        onChange={(e) => updateDriver(driverIndex, 'phone', e.target.value)}
                        error={validationErrors[`${driverIndex}_phone`]}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SelectGroup
                        id={`driver_${driverIndex}_country`}
                        label="Country"
                        value={driver.country}
                        onValueChange={(value) => updateDriver(driverIndex, 'country', value)}
                        error={validationErrors[`${driverIndex}_country`]}
                        disabled={loadingCountries}
                        placeholder={loadingCountries ? 'Loading...' : 'Select country'}
                        required
                      >
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <InputGroup
                        id={`driver_${driverIndex}_city`}
                        label="City"
                        value={driver.city}
                        onChange={(e) => updateDriver(driverIndex, 'city', e.target.value)}
                        error={validationErrors[`${driverIndex}_city`]}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputGroup
                        id={`driver_${driverIndex}_address`}
                        label="Address"
                        value={driver.address}
                        onChange={(e) => updateDriver(driverIndex, 'address', e.target.value)}
                        error={validationErrors[`${driverIndex}_address`]}
                        required
                      />
                      <DateGroup
                        id={`driver_${driverIndex}_birthday`}
                        label="Date of Birth"
                        value={driver.birthday}
                        onChange={(e) => updateDriver(driverIndex, 'birthday', e.target.value)}
                        error={validationErrors[`${driverIndex}_birthday`]}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  {/* Driver License Section */}
                  <div className="px-6 pb-6">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">
                      Driver License
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <InputGroup
                        id={`driver_${driverIndex}_license_num`}
                        label="Document Number"
                        value={driver.license_num}
                        onChange={(e) => updateDriver(driverIndex, 'license_num', e.target.value)}
                        error={validationErrors[`${driverIndex}_license_num`]}
                        required
                      />
                      <DateGroup
                        id={`driver_${driverIndex}_license_from`}
                        label="Issue Date"
                        value={driver.license_from}
                        onChange={(e) => updateDriver(driverIndex, 'license_from', e.target.value)}
                        error={validationErrors[`${driverIndex}_license_from`]}
                        max={new Date().toISOString().split('T')[0]}
                        required
                      />
                      <DateGroup
                        id={`driver_${driverIndex}_license_to`}
                        label="Expiry Date"
                        value={driver.license_to}
                        onChange={(e) => updateDriver(driverIndex, 'license_to', e.target.value)}
                        error={validationErrors[`${driverIndex}_license_to`]}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    {/* Upload Area */}
                    <div className="flex flex-wrap items-start gap-4">
                      <label
                        htmlFor={`driver_${driverIndex}_license_photo`}
                        className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200"
                      >
                        {Object.keys(uploadingFiles).some((key) =>
                          key.startsWith(`${driverIndex}_`)
                        ) ? (
                          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-5 h-5 text-slate-400" />
                            <span className="text-xs text-slate-400 mt-1">Upload</span>
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
                                  <ImageIcon className="w-6 h-6 text-slate-400" />
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

        {/* Add New Driver Button */}
        <button
          type="button"
          onClick={addDriver}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-full bg-white hover:bg-indigo-50/50 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          Add driver
        </button>

        {/* Continue Button */}
        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={isAnyUploading}
            className="w-full rounded-xl py-6 bg-slate-900 hover:bg-indigo-600 text-base font-medium"
          >
            {isAnyUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Continue to Extras
          </Button>
        </div>
      </form>
    </div>
  );
}
