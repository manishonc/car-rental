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
  ArrowLeft,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useBooking } from '../BookingContext';
import { updateOrderAction, confirmOrderAction } from '@/app/actions';
import { Stepper } from '@/components/ui/stepper';
import { bookingSteps } from '../BookingWizard';

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
    maxCompletedStep,
  } = state;

  const [localError, setLocalError] = useState<string | null>(null);
  const [mobileOrderExpanded, setMobileOrderExpanded] = useState(false);

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
      const updateResult = await updateOrderAction(orderId, selectedInsurance);

      if (!updateResult.success) {
        dispatch({
          type: 'SET_CONFIRMATION_ERROR',
          payload: updateResult.error || 'Failed to update order with insurance',
        });
        dispatch({ type: 'SET_IS_UPDATING_ORDER', payload: false });
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      dispatch({ type: 'SET_IS_CONFIRMING_ORDER', payload: true });
      let confirmResult = await confirmOrderAction(orderId, drivers, paymentMethod);

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto shadow-xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-500 mb-6">
            Your order has been successfully confirmed. You will receive a
            confirmation email shortly.
          </p>
          {orderId && (
            <p className="text-sm text-slate-400 mb-6">
              Order Reference: <span className="font-mono font-medium text-slate-900">{orderId}</span>
            </p>
          )}
          <Button
            className="rounded-xl"
            onClick={() => {
              dispatch({ type: 'RESET_BOOKING' });
            }}
          >
            Book Another Vehicle
          </Button>
        </div>
      </div>
    );
  }

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
            Confirm Booking
          </h2>
          <p className="text-slate-500 mt-1">Review your details and complete your booking</p>
        </div>
        <Stepper
          currentStep={5}
          steps={bookingSteps}
          maxCompletedStep={maxCompletedStep}
        />
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Payment & Actions (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Payment Method Selection */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Payment Method</h3>
            <div className="flex gap-3">
              {/* Card Payment */}
              <label
                className={`
                  flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
                  ${paymentMethod === 'card'
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300'
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
                  w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${paymentMethod === 'card' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}
                `}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className={`text-sm font-medium block ${paymentMethod === 'card' ? 'text-indigo-600' : 'text-slate-900'}`}>
                    Card
                  </span>
                  <span className="text-xs text-slate-400">Pay online securely</span>
                </div>
              </label>

              {/* Cash Payment */}
              <label
                className={`
                  flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
                  ${paymentMethod === 'cash'
                    ? 'border-indigo-600 bg-indigo-50/50'
                    : 'border-slate-200 hover:border-slate-300'
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
                  w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${paymentMethod === 'cash' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}
                `}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className={`text-sm font-medium block ${paymentMethod === 'cash' ? 'text-indigo-600' : 'text-slate-900'}`}>
                    Cash
                  </span>
                  <span className="text-xs text-slate-400">Pay at pickup</span>
                </div>
              </label>
            </div>
          </div>

          {/* Booking Details Card */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 space-y-5">
            {/* Vehicle Information */}
            {selectedVehicle && (
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Car className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Vehicle</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Vehicle</p>
                    <p className="font-medium text-slate-900">
                      {selectedVehicle.brand} {selectedVehicle.mark}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Type</p>
                    <p className="font-medium text-slate-900">{selectedVehicle.group}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Transmission</p>
                    <p className="font-medium text-slate-900 capitalize">
                      {selectedVehicle.transmission}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Fuel</p>
                    <p className="font-medium text-slate-900 capitalize">{selectedVehicle.fuel}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rental Period */}
            {searchDates && (
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Rental Period</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Pickup</p>
                    <p className="font-medium text-slate-900">
                      {new Date(searchDates.dateFrom).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {searchDates.timeFrom}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Return</p>
                    <p className="font-medium text-slate-900">
                      {new Date(searchDates.dateTo).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {searchDates.timeTo}
                    </p>
                  </div>
                </div>
                {locationData && (
                  <div className="mt-3 flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{locationData.name}</p>
                      <p className="text-xs text-slate-400">
                        {locationData.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Driver Information */}
            {drivers.length > 0 && (
              <div className="pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="font-semibold text-slate-900">
                    Driver{drivers.length > 1 ? 's' : ''}
                  </h3>
                </div>
                <div className="space-y-3">
                  {drivers.map((driver, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-medium text-slate-900">
                        {driver.first_name} {driver.last_name}
                        {index === 0 && (
                          <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            Primary
                          </span>
                        )}
                      </p>
                      <p className="text-slate-400 text-xs">{driver.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insurance */}
            {selectedInsuranceData && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Insurance</h3>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{selectedInsuranceData.option.title}</p>
                    {selectedInsuranceData.option.deposit === 1 && (
                      <p className="text-xs text-slate-400">
                        Deposit: {selectedInsuranceData.option.deposit_price} {currency}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-slate-900">
                    {selectedInsuranceData.calculatedPrice.toFixed(2)} {currency}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Order Summary - Collapsible (only visible on mobile) */}
          <div className="lg:hidden">
            <div className="bg-slate-900 text-white rounded-2xl overflow-hidden">
              {/* Compact header - always visible */}
              <button
                type="button"
                onClick={() => setMobileOrderExpanded(!mobileOrderExpanded)}
                className="w-full px-5 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                    <Car className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Total</p>
                    <p className="font-bold text-lg text-white">
                      {totalPrice.toFixed(2)} {currency}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-xs">View details</span>
                  {mobileOrderExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Expandable details */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  mobileOrderExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 pb-5 space-y-3 border-t border-white/10">
                  {selectedVehicle && (
                    <div className="flex justify-between items-center pt-4">
                      <div>
                        <p className="font-medium text-white text-sm">{selectedVehicle.brand} {selectedVehicle.mark}</p>
                        <p className="text-xs text-slate-400">{selectedVehicle.group}</p>
                      </div>
                      <p className="font-medium text-white text-sm">
                        {vehicleBasePrice.toFixed(2)} {currency}
                      </p>
                    </div>
                  )}

                  {selectedInsuranceData && (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white text-sm">{selectedInsuranceData.option.title}</p>
                        <p className="text-xs text-slate-400">Insurance</p>
                      </div>
                      <p className="font-medium text-white text-sm">
                        {insurancePrice.toFixed(2)} {currency}
                      </p>
                    </div>
                  )}

                  {searchDates && (
                    <div className="pt-3 border-t border-white/10 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(searchDates.dateFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' → '}
                          {new Date(searchDates.dateTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {locationData && (
                        <div className="flex items-center gap-2 text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span>{locationData.name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
                className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="terms" className="text-sm cursor-pointer text-slate-700">
                I have read and accept the{' '}
                <a href="#" className="text-indigo-600 hover:underline">
                  Terms & Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-indigo-600 hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Error Messages */}
            {(confirmationError || localError) && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-amber-800">{confirmationError || localError}</span>
              </div>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmOrder}
              disabled={!termsAccepted || isUpdatingOrder || isConfirmingOrder}
              size="lg"
              className="w-full rounded-xl py-6 bg-slate-900 hover:bg-indigo-600"
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
              <p className="text-xs text-center text-slate-400">
                You will be redirected to complete the payment securely
              </p>
            )}
            {paymentMethod === 'cash' && (
              <p className="text-xs text-center text-slate-400">
                You will pay in cash upon vehicle pickup
              </p>
            )}
          </div>
        </div>

        {/* Right: Dark Order Summary (2 cols) - Desktop only */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="bg-slate-900 text-white rounded-[2rem] p-6 sticky top-8 relative overflow-hidden">
            {/* Decorative indigo blur */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-600/30 rounded-full blur-3xl" />

            <h3 className="font-semibold text-white/90 text-sm uppercase tracking-wider mb-6 relative">
              Order Summary
            </h3>

            <div className="space-y-4 relative">
              {selectedVehicle && (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{selectedVehicle.brand} {selectedVehicle.mark}</p>
                    <p className="text-xs text-slate-400">{selectedVehicle.group}</p>
                  </div>
                  <p className="font-semibold text-white">
                    {vehicleBasePrice.toFixed(2)} {currency}
                  </p>
                </div>
              )}

              {selectedInsuranceData && (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{selectedInsuranceData.option.title}</p>
                    <p className="text-xs text-slate-400">Insurance</p>
                  </div>
                  <p className="font-semibold text-white">
                    {insurancePrice.toFixed(2)} {currency}
                  </p>
                </div>
              )}

              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Total</span>
                  <span className="text-2xl font-bold text-white">
                    {totalPrice.toFixed(2)} {currency}
                  </span>
                </div>
              </div>

              {searchDates && (
                <div className="border-t border-white/10 pt-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(searchDates.dateFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {' '}→{' '}
                      {new Date(searchDates.dateTo).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {locationData && (
                    <div className="flex items-center gap-2 text-slate-400 mt-2">
                      <MapPin className="w-4 h-4" />
                      <span>{locationData.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
