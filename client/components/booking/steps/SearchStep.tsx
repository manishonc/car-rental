'use client';

import { useEffect, startTransition, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, CarFront, MapPin, Clock } from 'lucide-react';
import { useBooking } from '../BookingContext';
import { searchCars, getLocations, cancelOrderAction } from '@/app/actions';

export function SearchStep() {
  const { state, dispatch, nextStep } = useBooking();
  const {
    locations,
    loadingLocations,
    selectedLocation,
    searchError,
    isSearching,
  } = state;

  // State for different drop-off location
  const [differentDropLocation, setDifferentDropLocation] = useState(false);
  const [dropLocation, setDropLocation] = useState('');

  // Default dates - format for datetime-local input (YYYY-MM-DDTHH:MM)
  const defaultPickupDateTime = '2026-02-16T09:15';
  const defaultReturnDateTime = '2026-02-17T09:45';
  const formatDateTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  const getMinDateTime = () => formatDateTime(new Date());

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
    <div className="p-4">
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Location Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Location</span>
          </div>
          
          <div className="space-y-3">
            {/* Pickup Location */}
            <div>
              <Label htmlFor="pickup_location" className="text-xs text-muted-foreground mb-1 block">
                Pickup
              </Label>
              {loadingLocations ? (
                <div className="h-9 flex items-center px-3 rounded-md bg-muted/50 text-muted-foreground text-sm">
                  <Loader2 className="w-3 h-3 animate-spin mr-2" />
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
                    <SelectTrigger className="w-full h-9 text-sm">
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

            {/* Different drop location toggle */}
            <div className="flex items-center justify-between py-1">
              <Label htmlFor="different-drop" className="text-sm cursor-pointer">
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
              <div>
                <Label htmlFor="drop_location" className="text-xs text-muted-foreground mb-1 block">
                  Drop-off
                </Label>
                <Select
                  value={dropLocation}
                  onValueChange={setDropLocation}
                >
                  <SelectTrigger className="w-full h-9 text-sm">
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
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Date & Time Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Date & Time</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pickup_datetime" className="text-xs text-muted-foreground mb-1 block">
                Pickup
              </Label>
              <Input
                type="datetime-local"
                name="pickup_datetime"
                id="pickup_datetime"
                className="h-9 text-sm"
                defaultValue={
                  state.searchDates?.dateFrom && state.searchDates?.timeFrom
                    ? `${state.searchDates.dateFrom}T${state.searchDates.timeFrom}`
                    : defaultPickupDateTime
                }
                required
                min={getMinDateTime()}
              />
            </div>
            <div>
              <Label htmlFor="return_datetime" className="text-xs text-muted-foreground mb-1 block">
                Return
              </Label>
              <Input
                type="datetime-local"
                name="return_datetime"
                id="return_datetime"
                className="h-9 text-sm"
                defaultValue={
                  state.searchDates?.dateTo && state.searchDates?.timeTo
                    ? `${state.searchDates.dateTo}T${state.searchDates.timeTo}`
                    : defaultReturnDateTime
                }
                required
                min={getMinDateTime()}
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {searchError && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-md text-sm">
            <CarFront className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-amber-800">
              {searchError.includes('No vehicles') 
                ? 'No vehicles available for the selected dates' 
                : searchError}
            </span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSearching || loadingLocations}
          className="w-full h-10"
        >
          {isSearching && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          {isSearching ? 'Searching...' : 'Search Available Cars'}
        </Button>
      </form>
    </div>
  );
}
