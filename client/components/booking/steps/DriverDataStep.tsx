'use client';

import { useState, useEffect, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, X, Trash2, Loader2, ImageIcon, AlertCircle } from 'lucide-react';
import { useBooking } from '../BookingContext';
import { uploadFileAction, getCountriesAction } from '@/app/actions';
import { Driver, Country } from '@/lib/api/types';

interface ValidationErrors {
  [key: string]: string;
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
      <Button variant="outline" onClick={prevStep}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Vehicle Selection
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {drivers.map((driver, driverIndex) => (
          <div
            key={driverIndex}
            className="bg-card rounded-xl border shadow-sm p-6 relative"
          >
            {/* Remove Driver Button */}
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
              {driverIndex === 0 ? 'Head Driver' : `Additional Driver ${driverIndex}`}
            </h3>

            {/* Personal Information */}
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`driver_${driverIndex}_first_name`}>
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    id={`driver_${driverIndex}_first_name`}
                    value={driver.first_name}
                    onChange={(e) => updateDriver(driverIndex, 'first_name', e.target.value)}
                    className={validationErrors[`${driverIndex}_first_name`] ? 'border-destructive' : ''}
                  />
                  {validationErrors[`${driverIndex}_first_name`] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors[`${driverIndex}_first_name`]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`driver_${driverIndex}_last_name`}>
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    id={`driver_${driverIndex}_last_name`}
                    value={driver.last_name}
                    onChange={(e) => updateDriver(driverIndex, 'last_name', e.target.value)}
                    className={validationErrors[`${driverIndex}_last_name`] ? 'border-destructive' : ''}
                  />
                  {validationErrors[`${driverIndex}_last_name`] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors[`${driverIndex}_last_name`]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`driver_${driverIndex}_email`}>
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    id={`driver_${driverIndex}_email`}
                    value={driver.email}
                    onChange={(e) => updateDriver(driverIndex, 'email', e.target.value)}
                    className={validationErrors[`${driverIndex}_email`] ? 'border-destructive' : ''}
                  />
                  {validationErrors[`${driverIndex}_email`] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors[`${driverIndex}_email`]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`driver_${driverIndex}_phone`}>
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="tel"
                    id={`driver_${driverIndex}_phone`}
                    value={driver.phone}
                    onChange={(e) => updateDriver(driverIndex, 'phone', e.target.value)}
                    placeholder="+41 XXX XXX XXXX"
                    className={validationErrors[`${driverIndex}_phone`] ? 'border-destructive' : ''}
                  />
                  {validationErrors[`${driverIndex}_phone`] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors[`${driverIndex}_phone`]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`driver_${driverIndex}_country`}>
                    Country <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={driver.country}
                    onValueChange={(value) => updateDriver(driverIndex, 'country', value)}
                    disabled={loadingCountries}
                  >
                    <SelectTrigger
                      className={`w-full ${validationErrors[`${driverIndex}_country`] ? 'border-destructive' : ''}`}
                      id={`driver_${driverIndex}_country`}
                    >
                      <SelectValue placeholder={loadingCountries ? 'Loading countries...' : 'Select a country'} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors[`${driverIndex}_country`] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors[`${driverIndex}_country`]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`driver_${driverIndex}_city`}>
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    id={`driver_${driverIndex}_city`}
                    value={driver.city}
                    onChange={(e) => updateDriver(driverIndex, 'city', e.target.value)}
                    className={validationErrors[`${driverIndex}_city`] ? 'border-destructive' : ''}
                  />
                  {validationErrors[`${driverIndex}_city`] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors[`${driverIndex}_city`]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor={`driver_${driverIndex}_address`}>
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    id={`driver_${driverIndex}_address`}
                    value={driver.address}
                    onChange={(e) => updateDriver(driverIndex, 'address', e.target.value)}
                    className={validationErrors[`${driverIndex}_address`] ? 'border-destructive' : ''}
                  />
                  {validationErrors[`${driverIndex}_address`] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors[`${driverIndex}_address`]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`driver_${driverIndex}_birthday`}>
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    id={`driver_${driverIndex}_birthday`}
                    value={driver.birthday}
                    onChange={(e) => updateDriver(driverIndex, 'birthday', e.target.value)}
                    className={validationErrors[`${driverIndex}_birthday`] ? 'border-destructive' : ''}
                  />
                  {validationErrors[`${driverIndex}_birthday`] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors[`${driverIndex}_birthday`]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Driver License Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Driver License
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`driver_${driverIndex}_license_num`}>
                    License Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    id={`driver_${driverIndex}_license_num`}
                    value={driver.license_num}
                    onChange={(e) => updateDriver(driverIndex, 'license_num', e.target.value)}
                    className={validationErrors[`${driverIndex}_license_num`] ? 'border-destructive' : ''}
                  />
                  {validationErrors[`${driverIndex}_license_num`] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors[`${driverIndex}_license_num`]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`driver_${driverIndex}_license_from`}>
                    Issue Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    id={`driver_${driverIndex}_license_from`}
                    value={driver.license_from}
                    onChange={(e) => updateDriver(driverIndex, 'license_from', e.target.value)}
                    className={validationErrors[`${driverIndex}_license_from`] ? 'border-destructive' : ''}
                  />
                  {validationErrors[`${driverIndex}_license_from`] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors[`${driverIndex}_license_from`]}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`driver_${driverIndex}_license_to`}>
                    Expiry Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    id={`driver_${driverIndex}_license_to`}
                    value={driver.license_to}
                    onChange={(e) => updateDriver(driverIndex, 'license_to', e.target.value)}
                    className={validationErrors[`${driverIndex}_license_to`] ? 'border-destructive' : ''}
                  />
                  {validationErrors[`${driverIndex}_license_to`] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors[`${driverIndex}_license_to`]}
                    </p>
                  )}
                </div>

                {/* File Upload */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label>License Photo</Label>

                  {/* Upload Area */}
                  <label
                    htmlFor={`driver_${driverIndex}_license_photo`}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {Object.keys(uploadingFiles).some((key) =>
                      key.startsWith(`${driverIndex}_`)
                    ) ? (
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-muted-foreground mb-2 animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload license photos
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
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

                  {/* Upload Errors */}
                  {Object.entries(uploadErrors)
                    .filter(([key]) => key.startsWith(`${driverIndex}_`))
                    .map(([key, error]) => (
                      <p key={key} className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                      </p>
                    ))}

                  {/* Uploaded Files */}
                  {uploadedFiles[driverIndex] && uploadedFiles[driverIndex].length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedFiles[driverIndex].map((file, fileIndex) => (
                        <div
                          key={`${driverIndex}_${fileIndex}`}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
                        >
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 w-14 h-14 rounded border overflow-hidden bg-background">
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
                          </div>

                          {/* File Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                              Uploaded
                            </span>
                          </div>

                          {/* Remove Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUploadedFile(driverIndex, fileIndex)}
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

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button type="button" variant="outline" onClick={addDriver}>
            <Plus className="w-4 h-4 mr-2" />
            Add Another Driver
          </Button>

          <Button type="submit" size="lg" disabled={isAnyUploading}>
            {isAnyUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Continue to Extras
          </Button>
        </div>
      </form>
    </div>
  );
}
