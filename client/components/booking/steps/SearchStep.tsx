'use client';

import { useEffect, startTransition, useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, CarFront, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { useBooking } from '../BookingContext';
import { searchCars, getLocations, cancelOrderAction } from '@/app/actions';
import { Stepper } from '@/components/ui/stepper';
import { bookingSteps } from '../BookingWizard';

export function SearchStep() {
  const { state, dispatch, nextStep } = useBooking();
  const {
    locations,
    loadingLocations,
    selectedLocation,
    searchError,
    isSearching,
    maxCompletedStep,
  } = state;

  // State for different drop-off location
  const [differentDropLocation, setDifferentDropLocation] = useState(false);
  const [dropLocation, setDropLocation] = useState('');

  // Smart date input state: show text placeholder, switch to datetime-local on focus
  const [pickupFocused, setPickupFocused] = useState(false);
  const [returnFocused, setReturnFocused] = useState(false);
  const [pickupValue, setPickupValue] = useState(
    state.searchDates?.dateFrom && state.searchDates?.timeFrom
      ? `${state.searchDates.dateFrom}T${state.searchDates.timeFrom}`
      : ''
  );
  const [returnValue, setReturnValue] = useState(
    state.searchDates?.dateTo && state.searchDates?.timeTo
      ? `${state.searchDates.dateTo}T${state.searchDates.timeTo}`
      : ''
  );
  const pickupRef = useRef<HTMLInputElement>(null);
  const returnRef = useRef<HTMLInputElement>(null);
  const pickupContainerRef = useRef<HTMLDivElement>(null);
  const returnContainerRef = useRef<HTMLDivElement>(null);

  // Format helper for datetime-local input (YYYY-MM-DDTHH:MM)
  const formatDateTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  const getMinDateTime = () => formatDateTime(new Date());

  // Handler functions for mobile date picker - ensure picker opens on first click
  const handlePickupClick = () => {
    setPickupFocused(true);
    setTimeout(() => {
      pickupRef.current?.focus();
      pickupRef.current?.showPicker?.();
    }, 10);
  };

  const handleReturnClick = () => {
    // Reset pickup focused state if no value was selected
    if (pickupFocused && !pickupValue) {
      setPickupFocused(false);
    }
    setReturnFocused(true);
    setTimeout(() => {
      returnRef.current?.focus();
      returnRef.current?.showPicker?.();
    }, 10);
  };

  // Format display value for date inputs
  const formatDisplayValue = (val: string) => {
    if (!val) return '';
    const date = new Date(val);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  // Load locations on mount
  useEffect(() => {
    if (locations.length === 0 && loadingLocations) {
      getLocations().then((locs) => {
        dispatch({ type: 'SET_LOCATIONS', payload: locs });
        if (locs.length > 0) {
          dispatch({ type: 'SET_SELECTED_LOCATION', payload: locs[0].id.toString() });
          setDropLocation(locs[0].id.toString());
        }
        dispatch({ type: 'SET_LOADING_LOCATIONS', payload: false });
      }).catch((error) => {
        console.error('Failed to load locations:', error);
        dispatch({ type: 'SET_LOADING_LOCATIONS', payload: false });
      });
    }
  }, [locations.length, loadingLocations, dispatch]);

  // Sync drop location with pickup when switch is off
  useEffect(() => {
    if (!differentDropLocation) {
      setDropLocation(selectedLocation);
    }
  }, [selectedLocation, differentDropLocation]);

  // Handle clicks outside date inputs to reset focused state if no value selected
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isPickupArea = pickupContainerRef.current?.contains(target);
      const isReturnArea = returnContainerRef.current?.contains(target);
      
      // Only reset if click is outside both date input areas
      if (!isPickupArea && pickupFocused && !pickupValue) {
        setPickupFocused(false);
      }
      if (!isReturnArea && returnFocused && !returnValue) {
        setReturnFocused(false);
      }
    };

    // Use a small delay to avoid conflicts with the showPicker() call
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [pickupFocused, pickupValue, returnFocused, returnValue]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Get search datetime values
    const pickupDateTimeStr = formData.get('pickup_datetime') as string;
    const returnDateTimeStr = formData.get('return_datetime') as string;

    // Validate dates
    if (!pickupDateTimeStr || !returnDateTimeStr) {
      dispatch({ type: 'SET_SEARCH_ERROR', payload: 'Please fill in pickup and return date/time' });
      return;
    }

    // Parse datetime-local values (format: YYYY-MM-DDTHH:MM)
    const [dateFrom, timeFrom] = pickupDateTimeStr.split('T');
    const [dateTo, timeTo] = returnDateTimeStr.split('T');

    const pickupDateTime = new Date(pickupDateTimeStr);
    const returnDateTime = new Date(returnDateTimeStr);

    // Add hidden form fields for backend compatibility
    formData.set('date_from', dateFrom);
    formData.set('time_from', timeFrom);
    formData.set('date_to', dateTo);
    formData.set('time_to', timeTo);

    if (returnDateTime <= pickupDateTime) {
      dispatch({ type: 'SET_SEARCH_ERROR', payload: 'Return date must be after pickup date' });
      return;
    }

    // Cancel existing draft order before new search
    if (state.orderId) {
      console.log('[SearchStep] Cancelling existing draft order:', state.orderId);
      const cancelResult = await cancelOrderAction(state.orderId);

      if (!cancelResult.success) {
        console.warn('[SearchStep] Failed to cancel existing order:', cancelResult.error);
      }

      dispatch({ type: 'SET_ORDER_ID', payload: null });
    }

    // Store search dates
    dispatch({
      type: 'SET_SEARCH_DATES',
      payload: { dateFrom, timeFrom, dateTo, timeTo },
    });

    // Reset previous results
    dispatch({ type: 'SET_SEARCH_ERROR', payload: null });
    dispatch({ type: 'SET_IS_SEARCHING', payload: true });
    dispatch({ type: 'SET_VEHICLES', payload: null });

    startTransition(async () => {
      try {
        const result = await searchCars({
          vehicles: null,
          error: null,
        }, formData);

        if (result.error) {
          dispatch({ type: 'SET_SEARCH_ERROR', payload: result.error });
        } else if (result.vehicles && result.vehicles.length > 0) {
          dispatch({ type: 'SET_VEHICLES', payload: result.vehicles });
          dispatch({ type: 'SET_MAX_COMPLETED_STEP', payload: 1 });
          nextStep();
        } else {
          dispatch({ type: 'SET_VEHICLES', payload: [] });
          dispatch({ type: 'SET_SEARCH_ERROR', payload: 'No vehicles found for the selected dates' });
        }
      } catch (error) {
        console.error('Search error:', error);
        dispatch({
          type: 'SET_SEARCH_ERROR',
          payload: error instanceof Error ? error.message : 'Search failed',
        });
      } finally {
        dispatch({ type: 'SET_IS_SEARCHING', payload: false });
      }
    });
  };

  return (
    <div className="min-h-[70vh] flex flex-col justify-center">
      {/* Hero Header with Stepper */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Where is your next journey?
          </h2>
          <p className="text-lg text-slate-500 max-w-xl">
            Experience the freedom of the road with our premium fleet.
          </p>
        </div>
        <Stepper
          currentStep={1}
          steps={bookingSteps}
          maxCompletedStep={maxCompletedStep}
        />
      </div>

      {/* Search Form - White pill container */}
      <form onSubmit={handleFormSubmit}>
        <div className="bg-white p-3 md:p-4 rounded-[2rem] shadow-xl shadow-indigo-100/50 border border-slate-200/60 mx-auto max-w-4xl">
          {/* Desktop: 2 rows layout, Mobile: stacked */}
          <div className="flex flex-col gap-3">
            {/* Row 1: Location */}
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                <MapPin className="w-6 h-6" />
              </div>
              {loadingLocations ? (
                <div className="w-full h-14 md:h-16 bg-slate-50 rounded-[1.25rem] pl-14 pr-4 flex items-center text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <>
                  <input type="hidden" name="pickup_location" value={selectedLocation} />
                  <Select
                    value={selectedLocation}
                    onValueChange={(value) =>
                      dispatch({ type: 'SET_SELECTED_LOCATION', payload: value })
                    }
                  >
                    <SelectTrigger className="w-full !h-14 md:!h-16 bg-slate-50 hover:bg-slate-100 rounded-[1.25rem] pl-14 pr-4 border border-transparent focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-medium text-sm shadow-none transition-all flex items-center justify-start">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {/* Row 2: Dates and Search Button */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Pickup DateTime */}
              <div ref={pickupContainerRef} className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                  <Calendar className="w-5 h-5" />
                </div>
                {pickupFocused || pickupValue ? (
                  <>
                    <input
                      ref={pickupRef}
                      type="datetime-local"
                      name="pickup_datetime"
                      id="pickup_datetime"
                      className="w-full h-14 md:h-16 bg-slate-50 rounded-[1.25rem] pl-12 pr-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500 transition-all"
                      value={pickupValue}
                      onChange={(e) => setPickupValue(e.target.value)}
                      onBlur={() => { if (!pickupValue) setPickupFocused(false); }}
                      min={getMinDateTime()}
                      autoFocus={pickupFocused && !pickupValue}
                    />
                    {!pickupValue && (
                      <div className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-sm font-medium">
                        Pick-up Date & Time
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value=""
                    className="w-full h-14 md:h-16 bg-slate-50 hover:bg-slate-100 rounded-[1.25rem] pl-12 pr-3 text-sm text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500 cursor-pointer transition-all"
                    placeholder="Pick-up Date & Time"
                    onChange={() => {}}
                    onFocus={handlePickupClick}
                    onClick={handlePickupClick}
                  />
                )}
                {/* Hidden input for form submission when using placeholder */}
                {!pickupFocused && !pickupValue && (
                  <input type="hidden" name="pickup_datetime" value="" />
                )}
              </div>

              {/* Return DateTime */}
              <div ref={returnContainerRef} className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
                  <Calendar className="w-5 h-5" />
                </div>
                {returnFocused || returnValue ? (
                  <>
                    <input
                      ref={returnRef}
                      type="datetime-local"
                      name="return_datetime"
                      id="return_datetime"
                      className="w-full h-14 md:h-16 bg-slate-50 rounded-[1.25rem] pl-12 pr-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500 transition-all"
                      value={returnValue}
                      onChange={(e) => setReturnValue(e.target.value)}
                      onBlur={() => { if (!returnValue) setReturnFocused(false); }}
                      min={getMinDateTime()}
                      autoFocus={returnFocused && !returnValue}
                    />
                    {!returnValue && (
                      <div className="absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-sm font-medium">
                        Return Date & Time
                      </div>
                    )}
                  </>
                ) : (
                  <input
                    type="text"
                    readOnly
                    value=""
                    className="w-full h-14 md:h-16 bg-slate-50 hover:bg-slate-100 rounded-[1.25rem] pl-12 pr-3 text-sm text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500 cursor-pointer transition-all"
                    placeholder="Return Date & Time"
                    onChange={() => {}}
                    onFocus={handleReturnClick}
                    onClick={handleReturnClick}
                  />
                )}
                {!returnFocused && !returnValue && (
                  <input type="hidden" name="return_datetime" value="" />
                )}
              </div>

              {/* Search Button */}
              <button
                type="submit"
                disabled={isSearching || loadingLocations}
                className="w-full h-14 md:h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-[1.25rem] font-semibold text-base shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    Searching...
                  </>
                ) : (
                  <>
                    Search
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Different drop-off toggle */}
        <div className="mt-4 px-2 flex items-center justify-between">
          <Label htmlFor="different-drop" className="text-sm text-slate-500 cursor-pointer">
            Different drop-off location
          </Label>
          <Switch
            id="different-drop"
            checked={differentDropLocation}
            onCheckedChange={setDifferentDropLocation}
          />
        </div>

        {/* Drop-off Location (conditional) */}
        {differentDropLocation && (
          <div className="mt-2 mx-auto max-w-4xl">
            <div className="bg-white p-2 md:p-3 rounded-[2rem] shadow-lg border border-slate-200/60">
              <div className="flex items-center gap-3 px-5 py-4">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                <Select
                  value={dropLocation}
                  onValueChange={setDropLocation}
                >
                  <SelectTrigger className="w-full border-0 bg-transparent shadow-none p-0 h-auto text-slate-900 font-medium text-sm focus:ring-0">
                    <SelectValue placeholder="Select drop-off location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {searchError && (
          <div className="flex items-center gap-2 px-4 py-3 mt-4 bg-amber-50 rounded-xl text-sm border border-amber-200 mx-auto max-w-4xl">
            <CarFront className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-amber-800">
              {searchError.includes('No vehicles')
                ? 'No vehicles available for the selected dates'
                : searchError}
            </span>
          </div>
        )}
      </form>
    </div>
  );
}
