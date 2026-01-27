'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Loader2,
  Car,
  Calendar,
  User,
  Shield,
  CheckCircle2,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { useBooking } from '../BookingContext';
import { updateOrderAction, confirmOrderAction } from '@/app/actions';

export function ConfirmOrderStep() {
  const { state, dispatch, prevStep } = useBooking();
  const {
    selectedVehicle,
    searchDates,
    selectedLocation,
    locations,
    drivers,
    selectedInsurance,
    calculatedInsurances,
    termsAccepted,
    orderId,
    isUpdatingOrder,
    isConfirmingOrder,
    confirmationError,
    orderConfirmed,
    paymentMethod,
  } = state;

  const [localError, setLocalError] = useState<string | null>(null);

  const selectedInsuranceData = calculatedInsurances.find(
    (calc) => calc.option.id === selectedInsurance
  );
  const vehicleBasePrice = selectedVehicle
    ? parseFloat(selectedVehicle.total_price) || 0
    : 0;
  const insurancePrice = selectedInsuranceData?.calculatedPrice || 0;
  const totalPrice = vehicleBasePrice + insurancePrice;
  const currency = selectedVehicle?.currency || 'CHF';

  const locationData = locations.find(
    (loc) => loc.id.toString() === selectedLocation
  );

  const handleConfirmOrder = async () => {
    setLocalError(null);

    if (!termsAccepted) {
      dispatch({
        type: 'SET_CONFIRMATION_ERROR',
        payload: 'Please accept the Terms & Conditions to continue',
      });
      return;
    }

    if (!orderId || !selectedInsurance) {
      dispatch({
        type: 'SET_CONFIRMATION_ERROR',
        payload: 'Missing order information. Please go back and try again.',
      });
      return;
    }

    dispatch({ type: 'SET_CONFIRMATION_ERROR', payload: null });
    dispatch({ type: 'SET_IS_UPDATING_ORDER', payload: true });

    try {
      // First, update order with insurance
      const updateResult = await updateOrderAction(orderId, selectedInsurance);

      if (!updateResult.success) {
        dispatch({
          type: 'SET_CONFIRMATION_ERROR',
          payload: updateResult.error || 'Failed to update order with insurance',
        });
        dispatch({ type: 'SET_IS_UPDATING_ORDER', payload: false });
        return;
      }

      // Add a small delay to ensure server has processed the insurance update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Then, confirm the order with retry logic
      dispatch({ type: 'SET_IS_CONFIRMING_ORDER', payload: true });
      let confirmResult = await confirmOrderAction(orderId, drivers, paymentMethod);

      // Retry once if confirmation fails
      if (!confirmResult.success) {
        console.log('Confirm order failed, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        confirmResult = await confirmOrderAction(orderId, drivers, paymentMethod);
      }

      if (!confirmResult.success) {
        dispatch({
          type: 'SET_CONFIRMATION_ERROR',
          payload: confirmResult.error || 'Failed to confirm order',
        });
      } else {
        console.log('[ConfirmOrderStep] Confirmation result:', {
          paymentMethod,
          hasData: !!confirmResult.data,
          data: confirmResult.data,
          paymentId: confirmResult.data?.payment_id,
        });
        
        // Handle payment redirect for card payments
        if (paymentMethod === 'card' && confirmResult.data?.payment_id) {
          // Redirect to payment page
          const paymentUrl = `https://pay.rentsyst.com/?payment_id=${confirmResult.data.payment_id}`;
          console.log('[ConfirmOrderStep] Redirecting to payment:', paymentUrl);
          window.location.href = paymentUrl;
          return; // Don't show success state, redirect happens
        } else if (paymentMethod === 'card' && !confirmResult.data?.payment_id) {
          console.error('[ConfirmOrderStep] Card payment selected but no payment_id in response:', confirmResult.data);
          dispatch({
            type: 'SET_CONFIRMATION_ERROR',
            payload: 'Payment ID not received. Please contact support.',
          });
        } else {
          // Cash payment - show success message
          dispatch({ type: 'SET_ORDER_CONFIRMED', payload: true });
          dispatch({ type: 'SET_MAX_COMPLETED_STEP', payload: 5 });
        }
      }
    } catch (error) {
      console.error('Order confirmation error:', error);
      dispatch({
        type: 'SET_CONFIRMATION_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to confirm order',
      });
    } finally {
      dispatch({ type: 'SET_IS_UPDATING_ORDER', payload: false });
      dispatch({ type: 'SET_IS_CONFIRMING_ORDER', payload: false });
    }
  };

  // Success State
  if (orderConfirmed) {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-muted-foreground mb-6">
          Your order has been successfully confirmed. You will receive a
          confirmation email shortly.
        </p>
        {orderId && (
          <p className="text-sm text-muted-foreground">
            Order Reference: <span className="font-mono font-medium">{orderId}</span>
          </p>
        )}
        <Button
          className="mt-6"
          onClick={() => {
            dispatch({ type: 'RESET_BOOKING' });
          }}
        >
          Book Another Vehicle
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">Confirm Your Booking</h2>

        {/* Order Summary Sections */}
        <div className="space-y-6">
          {/* Vehicle Information */}
          {selectedVehicle && (
            <div className="border-b pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Car className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Vehicle</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Vehicle</p>
                  <p className="font-medium">
                    {selectedVehicle.brand} {selectedVehicle.mark}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedVehicle.group}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transmission</p>
                  <p className="font-medium capitalize">
                    {selectedVehicle.transmission}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fuel</p>
                  <p className="font-medium capitalize">{selectedVehicle.fuel}</p>
                </div>
              </div>
            </div>
          )}

          {/* Rental Period */}
          {searchDates && (
            <div className="border-b pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Rental Period</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pickup</p>
                  <p className="font-medium">
                    {new Date(searchDates.dateFrom).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at {searchDates.timeFrom}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Return</p>
                  <p className="font-medium">
                    {new Date(searchDates.dateTo).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    at {searchDates.timeTo}
                  </p>
                </div>
              </div>
              {locationData && (
                <div className="mt-3 flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{locationData.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {locationData.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Driver Information */}
          {drivers.length > 0 && (
            <div className="border-b pb-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">
                  Driver{drivers.length > 1 ? 's' : ''}
                </h3>
              </div>
              <div className="space-y-3">
                {drivers.map((driver, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium">
                      {driver.first_name} {driver.last_name}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Primary)
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground">{driver.email}</p>
                    <p className="text-muted-foreground">{driver.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insurance */}
          {selectedInsuranceData && (
            <div className="border-b pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Insurance</h3>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium">{selectedInsuranceData.option.title}</p>
                  {selectedInsuranceData.option.deposit === 1 && (
                    <p className="text-xs text-muted-foreground">
                      Deposit: {selectedInsuranceData.option.deposit_price} {currency}
                    </p>
                  )}
                </div>
                <p className="font-semibold">
                  {selectedInsuranceData.calculatedPrice.toFixed(2)} {currency}
                </p>
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Price Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle Rental:</span>
                <span className="font-medium">
                  {vehicleBasePrice.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance:</span>
                <span className="font-medium">
                  {insurancePrice.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span>
                  {totalPrice.toFixed(2)} {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Payment Method</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) =>
                    dispatch({ type: 'SET_PAYMENT_METHOD', payload: 'card' })
                  }
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Card Payment</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) =>
                    dispatch({ type: 'SET_PAYMENT_METHOD', payload: 'cash' })
                  }
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">Cash Payment</span>
              </label>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) =>
                  dispatch({ type: 'SET_TERMS_ACCEPTED', payload: e.target.checked })
                }
                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="terms" className="text-sm cursor-pointer">
                I have read and accept the{' '}
                <a href="#" className="text-primary hover:underline">
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Error Messages */}
            {(confirmationError || localError) && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-amber-800">{confirmationError || localError}</span>
              </div>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmOrder}
              disabled={!termsAccepted || isUpdatingOrder || isConfirmingOrder}
              size="lg"
              className="w-full"
            >
              {(isUpdatingOrder || isConfirmingOrder) && (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              )}
              {isUpdatingOrder
                ? 'Updating Order...'
                : isConfirmingOrder
                ? 'Confirming...'
                : paymentMethod === 'card'
                ? `Confirm & Pay ${totalPrice.toFixed(2)} ${currency}`
                : `Confirm Booking ${totalPrice.toFixed(2)} ${currency}`}
            </Button>

            {paymentMethod === 'card' && (
              <p className="text-xs text-center text-muted-foreground">
                You will be redirected to complete the payment
              </p>
            )}
            {paymentMethod === 'cash' && (
              <p className="text-xs text-center text-muted-foreground">
                You will pay in cash upon vehicle pickup
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
