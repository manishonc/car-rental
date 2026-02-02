'use client';

import { Button } from '@/components/ui/button';
import { VehicleCard } from '@/components/VehicleCard';
import { ArrowLeft, Loader2, Car, AlertTriangle } from 'lucide-react';
import { useBooking } from '../BookingContext';
import { createOrderAction, cancelOrderAction } from '@/app/actions';
import { Vehicle } from '@/lib/api/types';
import { Stepper } from '@/components/ui/stepper';
import { bookingSteps } from '../BookingWizard';

export function VehicleSelectionStep() {
  const { state, dispatch, prevStep, nextStep, goToStep } = useBooking();
  const {
    vehicles,
    selectedLocation,
    searchDates,
    isCreatingOrder,
    orderError,
    maxCompletedStep,
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

    // Cancel existing draft order before creating new one
    if (state.orderId) {
      console.log('[VehicleSelection] Cancelling existing draft order:', state.orderId);
      dispatch({ type: 'SET_IS_CREATING_ORDER', payload: true });
      dispatch({ type: 'SET_ORDER_ERROR', payload: null });
      const cancelResult = await cancelOrderAction(state.orderId);
      if (!cancelResult.success) {
        console.warn('[VehicleSelection] Failed to cancel existing order:', cancelResult.error);
      }
      dispatch({ type: 'SET_ORDER_ID', payload: null });
      dispatch({ type: 'SET_SELECTED_VEHICLE', payload: null });
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
            Back to Search
          </button>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Select Vehicle
          </h2>
          <div className="flex items-center gap-3 mt-2">
            {searchDates && (
              <p className="text-slate-500">
                <span className="font-medium text-slate-700">
                  {new Date(searchDates.dateFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="mx-2 text-slate-300">&rarr;</span>
                <span className="font-medium text-slate-700">
                  {new Date(searchDates.dateTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </p>
            )}
            {vehicles && vehicles.length > 0 && (
              <span className="text-sm text-slate-400">
                {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} found
              </span>
            )}
          </div>
        </div>
        <Stepper
          currentStep={2}
          steps={bookingSteps}
          maxCompletedStep={maxCompletedStep}
        />
      </div>

      {/* Order Creation Loading Overlay */}
      {isCreatingOrder && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Car className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-slate-900">Booking Vehicle</h3>
                <p className="text-slate-500 text-sm mt-1">Please wait while we prepare your order...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {orderError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm animate-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-red-700">Booking Failed</span>
            <span className="text-red-600">{orderError}</span>
          </div>
        </div>
      )}

      {/* No Vehicles Found */}
      {vehicles && vehicles.length === 0 && (
        <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-300">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Vehicles Available</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            We couldn&apos;t find any vehicles matching your search criteria for these dates.
            Try adjusting your pickup or return dates.
          </p>
          <Button onClick={prevStep} size="lg">
            Modify Search
          </Button>
        </div>
      )}

      {/* Vehicle List */}
      {vehicles && vehicles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onBook={handleBookVehicle}
              isLoading={isCreatingOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
