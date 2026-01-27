'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Shield, AlertCircle } from 'lucide-react';
import { useBooking } from '../BookingContext';
import { insuranceOptions } from '@/lib/config/insurance';
import { calculateAllInsurancePremiums } from '@/lib/utils/insurance-calculator';

export function ExtrasStep() {
  const { state, dispatch, prevStep, nextStep } = useBooking();
  const {
    drivers,
    searchDates,
    selectedVehicle,
    selectedInsurance,
    calculatedInsurances,
  } = state;

  // Calculate insurance premiums when entering this step
  useEffect(() => {
    if (
      drivers.length > 0 &&
      searchDates &&
      drivers[0].birthday &&
      drivers[0].license_from
    ) {
      const headDriver = drivers[0];
      const pickupDate = searchDates.dateFrom;
      const pickupDateTime = new Date(`${searchDates.dateFrom}T${searchDates.timeFrom}`);
      const returnDateTime = new Date(`${searchDates.dateTo}T${searchDates.timeTo}`);
      const rentalDays = Math.ceil(
        (returnDateTime.getTime() - pickupDateTime.getTime()) / (1000 * 60 * 60 * 24)
      );

      const calculated = calculateAllInsurancePremiums(
        insuranceOptions,
        {
          birthday: headDriver.birthday,
          license_from: headDriver.license_from,
          license_to: headDriver.license_to,
          country: headDriver.country,
        },
        pickupDate,
        rentalDays
      );

      dispatch({ type: 'SET_CALCULATED_INSURANCES', payload: calculated });

      // Set default selected insurance (first checked one or first eligible one)
      if (calculated.length > 0 && !selectedInsurance) {
        const defaultInsurance =
          calculated.find((calc) => calc.option.checked) || calculated[0];
        if (defaultInsurance) {
          dispatch({ type: 'SET_SELECTED_INSURANCE', payload: defaultInsurance.option.id });
        }
      }
    }
  }, [drivers, searchDates, dispatch, selectedInsurance]);

  const selectedInsuranceData = calculatedInsurances.find(
    (calc) => calc.option.id === selectedInsurance
  );
  const vehicleBasePrice = selectedVehicle
    ? parseFloat(selectedVehicle.total_price) || 0
    : 0;
  const insurancePrice = selectedInsuranceData?.calculatedPrice || 0;
  const totalPrice = vehicleBasePrice + insurancePrice;
  const currency = selectedVehicle?.currency || 'CHF';

  const handleContinue = () => {
    if (selectedInsurance) {
      dispatch({ type: 'SET_MAX_COMPLETED_STEP', payload: 4 });
      nextStep();
    }
  };

  const isInsuranceValid = selectedInsuranceData?.factors.isValid !== false;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold">Insurance Options</h2>
            <p className="text-muted-foreground">
              Select your preferred coverage level
            </p>
          </div>
        </div>

        {calculatedInsurances.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Calculating insurance options...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {calculatedInsurances.map((calculated) => {
              const isSelected = selectedInsurance === calculated.option.id;
              const isInvalid = !calculated.factors.isValid;

              return (
                <div
                  key={calculated.option.id}
                  onClick={() => !isInvalid && dispatch({ type: 'SET_SELECTED_INSURANCE', payload: calculated.option.id })}
                  className={`
                    border-2 rounded-xl p-5 transition-all cursor-pointer
                    ${isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-muted hover:border-muted-foreground/50'
                    }
                    ${isInvalid ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Radio Circle */}
                      <div
                        className={`
                          w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/50'}
                        `}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {calculated.option.title}
                          </h3>
                          {calculated.option.checked && (
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                              Recommended
                            </span>
                          )}
                          {isInvalid && (
                            <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Invalid License
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          {calculated.option.deposit === 1 && (
                            <p>
                              Deposit: {calculated.option.deposit_price} {currency}
                            </p>
                          )}
                          {calculated.option.damage === 1 && (
                            <p>
                              Damage Access: {calculated.option.damage_access} {currency}
                            </p>
                          )}
                          {calculated.option.price_title && (
                            <p className="text-xs opacity-75">
                              {calculated.option.price_title}
                            </p>
                          )}
                        </div>

                        {!isInvalid && (
                          <div className="mt-3 pt-3 border-t border-dashed text-xs text-muted-foreground">
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              <span>Base: {calculated.basePrice.toFixed(2)} {currency}</span>
                              {(calculated.factors.ageFactor !== 1 ||
                                calculated.factors.tenureFactor !== 1 ||
                                calculated.factors.countryFactor !== 1) && (
                                <span className="text-muted-foreground/75">
                                  Adjustments: Age ({calculated.factors.ageFactor.toFixed(2)}x),
                                  Tenure ({calculated.factors.tenureFactor.toFixed(2)}x),
                                  Country ({calculated.factors.countryFactor.toFixed(2)}x)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-2xl font-bold">
                        {calculated.calculatedPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{currency}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Price Summary */}
        {selectedInsuranceData && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">Price Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Vehicle Rental:</span>
                <span className="font-medium">
                  {vehicleBasePrice.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">
                  Insurance ({selectedInsuranceData.option.title}):
                </span>
                <span className="font-medium">
                  {insurancePrice.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t font-bold text-base">
                <span>Total:</span>
                <span>
                  {totalPrice.toFixed(2)} {currency}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleContinue}
            disabled={!selectedInsurance || !isInsuranceValid}
            size="lg"
          >
            Continue to Confirmation
          </Button>
        </div>
      </div>
    </div>
  );
}
