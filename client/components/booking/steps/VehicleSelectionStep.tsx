'use client';

import { Button } from '@/components/ui/button';
import { VehicleCard } from '@/components/VehicleCard';
import { ArrowLeft, Loader2, Car } from 'lucide-react';
import { useBooking } from '../BookingContext';
import { createOrderAction } from '@/app/actions';
import { Vehicle } from '@/lib/api/types';

export function VehicleSelectionStep() {
  const { state, dispatch, prevStep, nextStep } = useBooking();
  const {
    vehicles,
    selectedLocation,
    searchDates,
    isCreatingOrder,
    orderError,
  } = state;

  // Helper function to format dates in "YYYY-MM-DD HH:mm:ss" format
  const formatDateTime = (date: string, time: string): string => {
    return `${date} ${time}:00`;
  };

  const handleBookVehicle = async (vehicle: Vehicle) => {
    if (!searchDates || !selectedLocation) {
      dispatch({
        type: 'SET_ORDER_ERROR',
        payload: 'Missing search information. Please search again.',
      });
      return;
    }

    dispatch({ type: 'SET_IS_CREATING_ORDER', payload: true });
    dispatch({ type: 'SET_ORDER_ERROR', payload: null });
    dispatch({ type: 'SET_SELECTED_VEHICLE', payload: vehicle });

    try {
      const dateFrom = formatDateTime(searchDates.dateFrom, searchDates.timeFrom);
      const dateTo = formatDateTime(searchDates.dateTo, searchDates.timeTo);

      const result = await createOrderAction({
        vehicle_id: parseInt(vehicle.id, 10),
        date_from: dateFrom,
        date_to: dateTo,
        pickup_location: parseInt(selectedLocation, 10),
        return_location: parseInt(selectedLocation, 10),
      });

      if (result.error) {
        dispatch({ type: 'SET_ORDER_ERROR', payload: result.error });
        dispatch({ type: 'SET_SELECTED_VEHICLE', payload: null });
      } else if (result.orderId) {
        dispatch({ type: 'SET_ORDER_ID', payload: result.orderId });
        dispatch({ type: 'SET_MAX_COMPLETED_STEP', payload: 2 });
        nextStep();
      } else {
        dispatch({ type: 'SET_ORDER_ERROR', payload: 'Order ID not found in response' });
        dispatch({ type: 'SET_SELECTED_VEHICLE', payload: null });
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      dispatch({
        type: 'SET_ORDER_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to create order',
      });
      dispatch({ type: 'SET_SELECTED_VEHICLE', payload: null });
    } finally {
      dispatch({ type: 'SET_IS_CREATING_ORDER', payload: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={prevStep}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Search
      </Button>

      {/* Order Creation Loading */}
      {isCreatingOrder && (
        <div className="bg-card rounded-xl border shadow-sm p-8">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <p className="text-muted-foreground">Creating your order...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {orderError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          <p className="font-semibold mb-1">Order Creation Failed</p>
          <p className="text-sm">{orderError}</p>
        </div>
      )}

      {/* No Vehicles Found */}
      {vehicles && vehicles.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border p-6">
          <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Vehicles Available</h3>
          <p className="text-muted-foreground">
            No vehicles found for the selected dates. Try different dates or locations.
          </p>
          <Button variant="outline" onClick={prevStep} className="mt-4">
            Modify Search
          </Button>
        </div>
      )}

      {/* Vehicle List */}
      {vehicles && vehicles.length > 0 && !isCreatingOrder && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} available
            </h2>
            {searchDates && (
              <p className="text-sm text-muted-foreground">
                {new Date(searchDates.dateFrom).toLocaleDateString()} -{' '}
                {new Date(searchDates.dateTo).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onBook={handleBookVehicle}
                isLoading={isCreatingOrder}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
