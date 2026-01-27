'use client';

import { useEffect, startTransition } from 'react';
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
import { Loader2, Calendar, MapPin } from 'lucide-react';
import { useBooking } from '../BookingContext';
import { searchCars, getLocations } from '@/app/actions';

export function SearchStep() {
  const { state, dispatch, nextStep } = useBooking();
  const {
    locations,
    loadingLocations,
    selectedLocation,
    searchError,
    isSearching,
  } = state;

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
        }
        dispatch({ type: 'SET_LOADING_LOCATIONS', payload: false });
      }).catch((error) => {
        console.error('Failed to load locations:', error);
        dispatch({ type: 'SET_LOADING_LOCATIONS', payload: false });
      });
    }
  }, [locations.length, loadingLocations, dispatch]);

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

  const selectedLocationData = locations.find(
    (loc) => loc.id.toString() === selectedLocation
  );

  return (
    <div className="bg-card rounded-xl border shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Find Your Perfect Vehicle</h2>
        <p className="text-muted-foreground">
          Enter your pickup and return dates to see available vehicles
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pickup_datetime">Pickup Date & Time</Label>
            <Input
              type="datetime-local"
              name="pickup_datetime"
              id="pickup_datetime"
              defaultValue={
                state.searchDates?.dateFrom && state.searchDates?.timeFrom
                  ? `${state.searchDates.dateFrom}T${state.searchDates.timeFrom}`
                  : defaultPickupDateTime
              }
              required
              min={getMinDateTime()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="return_datetime">Return Date & Time</Label>
            <Input
              type="datetime-local"
              name="return_datetime"
              id="return_datetime"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pickup_location">Pickup Location</Label>
            {loadingLocations ? (
              <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading locations...
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
            <Label>Return Location</Label>
            <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-muted-foreground text-sm truncate">
              {loadingLocations ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : selectedLocationData ? (
                `${selectedLocationData.name} - ${selectedLocationData.address}`
              ) : (
                'Same as pickup location'
              )}
            </div>
          </div>
        </div>

        {searchError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="font-medium">Search Error</p>
            <p className="text-sm mt-1">{searchError}</p>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Button
            type="submit"
            disabled={isSearching || loadingLocations}
            size="lg"
            className="min-w-[200px]"
          >
            {isSearching && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            {isSearching ? 'Searching...' : 'Search Available Cars'}
          </Button>
        </div>
      </form>
    </div>
  );
}
