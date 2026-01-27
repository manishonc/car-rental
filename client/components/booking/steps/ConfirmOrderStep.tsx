'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Car,
  Calendar,
  User,
  Shield,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  CreditCard,
  Banknote,
  Clock,
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
        // Handle payment redirect for card payments
        if (paymentMethod === 'card' && confirmResult.data?.payment_id) {
          const paymentUrl = `https://pay.rentsyst.com/?payment_id=${confirmResult.data.payment_id}`;
          window.location.href = paymentUrl;
          return;
        } else if (paymentMethod === 'card' && !confirmResult.data?.payment_id) {
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
      <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
        <p className="text-muted-foreground mb-6">
          Your order has been successfully confirmed. You will receive a
          confirmation email shortly.
        </p>
        {orderId && (
          <p className="text-sm text-muted-foreground">
            Order Reference: <span className="font-mono font-medium text-foreground">{orderId}</span>
          </p>
        )}
        <Button
          className="mt-6 rounded-xl"
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
      <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Confirm Your Booking</h2>

        {/* Order Summary Sections */}
        <div className="space-y-5">
          {/* Vehicle Information */}
          {selectedVehicle && (
            <div className="pb-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Car className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Vehicle</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Vehicle</p>
                  <p className="font-medium text-foreground">
                    {selectedVehicle.brand} {selectedVehicle.mark}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Type</p>
                  <p className="font-medium text-foreground">{selectedVehicle.group}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Transmission</p>
                  <p className="font-medium text-foreground capitalize">
                    {selectedVehicle.transmission}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Fuel</p>
                  <p className="font-medium text-foreground capitalize">{selectedVehicle.fuel}</p>
                </div>
              </div>
            </div>
          )}

          {/* Rental Period */}
          {searchDates && (
            <div className="pb-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Rental Period</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Pickup</p>
                  <p className="font-medium text-foreground">
                    {new Date(searchDates.dateFrom).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {searchDates.timeFrom}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Return</p>
                  <p className="font-medium text-foreground">
                    {new Date(searchDates.dateTo).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {searchDates.timeTo}
                  </p>
                </div>
              </div>
              {locationData && (
                <div className="mt-3 flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{locationData.name}</p>
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
            <div className="pb-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">
                  Driver{drivers.length > 1 ? 's' : ''}
                </h3>
              </div>
              <div className="space-y-3">
                {drivers.map((driver, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium text-foreground">
                      {driver.first_name} {driver.last_name}
                      {index === 0 && (
                        <span className="ml-2 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Primary
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">{driver.email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insurance */}
          {selectedInsuranceData && (
            <div className="pb-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Insurance</h3>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-foreground">{selectedInsuranceData.option.title}</p>
                  {selectedInsuranceData.option.deposit === 1 && (
                    <p className="text-xs text-muted-foreground">
                      Deposit: {selectedInsuranceData.option.deposit_price} {currency}
                    </p>
                  )}
                </div>
                <p className="font-semibold text-foreground">
                  {selectedInsuranceData.calculatedPrice.toFixed(2)} {currency}
                </p>
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <h4 className="font-medium text-foreground mb-3">Price Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle Rental:</span>
                <span className="font-medium text-foreground">
                  {vehicleBasePrice.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance:</span>
                <span className="font-medium text-foreground">
                  {insurancePrice.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border/50">
                <span className="text-foreground">Total:</span>
                <span className="text-primary">
                  {totalPrice.toFixed(2)} {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="pb-4 border-b border-border/50">
            <h3 className="font-semibold text-foreground mb-3 text-sm">Payment Method</h3>
            <div className="flex gap-2">
              {/* Card Payment Option */}
              <label 
                className={`
                  flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all
                  ${paymentMethod === 'card' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/40'
                  }
                `}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => dispatch({ type: 'SET_PAYMENT_METHOD', payload: 'card' })}
                  className="sr-only"
                />
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${paymentMethod === 'card' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
                `}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className={`text-sm font-medium block ${paymentMethod === 'card' ? 'text-primary' : 'text-foreground'}`}>
                    Card
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">Pay online</span>
                </div>
              </label>

              {/* Cash Payment Option */}
              <label 
                className={`
                  flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all
                  ${paymentMethod === 'cash' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/40'
                  }
                `}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => dispatch({ type: 'SET_PAYMENT_METHOD', payload: 'cash' })}
                  className="sr-only"
                />
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${paymentMethod === 'cash' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
                `}>
                  <Banknote className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className={`text-sm font-medium block ${paymentMethod === 'cash' ? 'text-primary' : 'text-foreground'}`}>
                    Cash
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:block">At pickup</span>
                </div>
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
                className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="terms" className="text-sm cursor-pointer text-foreground">
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
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-amber-800">{confirmationError || localError}</span>
              </div>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmOrder}
              disabled={!termsAccepted || isUpdatingOrder || isConfirmingOrder}
              size="lg"
              className="w-full rounded-xl py-6"
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
                You will be redirected to complete the payment securely
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
