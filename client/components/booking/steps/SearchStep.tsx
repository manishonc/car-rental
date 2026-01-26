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
import { Loader2 } from 'lucide-react';
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

  // Default dates
  const defaultPickupDate = new Date('2026-02-16');
  const defaultReturnDate = new Date('2026-02-17');
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

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

    // Get search dates
    const dateFrom = formData.get('date_from') as string;
    const timeFrom = formData.get('time_from') as string;
    const dateTo = formData.get('date_to') as string;
    const timeTo = formData.get('time_to') as string;

    // Validate dates
    if (!dateFrom || !timeFrom || !dateTo || !timeTo) {
      dispatch({ type: 'SET_SEARCH_ERROR', payload: 'Please fill in all date and time fields' });
      return;
    }

    const pickupDateTime = new Date(`${dateFrom}T${timeFrom}`);
    const returnDateTime = new Date(`${dateTo}T${timeTo}`);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_from">Pickup Date</Label>
            <Input
              type="date"
              name="date_from"
              id="date_from"
              defaultValue={state.searchDates?.dateFrom || formatDate(defaultPickupDate)}
              required
              min={formatDate(new Date())}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time_from">Pickup Time</Label>
            <Input
              type="time"
              name="time_from"
              id="time_from"
              defaultValue={state.searchDates?.timeFrom || '09:15'}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_to">Return Date</Label>
            <Input
              type="date"
              name="date_to"
              id="date_to"
              defaultValue={state.searchDates?.dateTo || formatDate(defaultReturnDate)}
              required
              min={formatDate(new Date())}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time_to">Return Time</Label>
            <Input
              type="time"
              name="time_to"
              id="time_to"
              defaultValue={state.searchDates?.timeTo || '09:45'}
              required
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
