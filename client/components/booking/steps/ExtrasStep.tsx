'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Check,
  Shield,
  AlertCircle,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Info,
  Car,
  ArrowLeft
} from 'lucide-react';
import { useBooking } from '../BookingContext';
import { insuranceOptions, CoverageDetail } from '@/lib/config/insurance';
import { calculateAllInsurancePremiums } from '@/lib/utils/insurance-calculator';
import { Stepper } from '@/components/ui/stepper';
import { bookingSteps } from '../BookingWizard';

// Mobile-friendly expandable coverage section
function CoverageSection({
  details,
  highlights,
  isExpanded,
  onToggle,
  isSelected
}: {
  details: CoverageDetail[];
  highlights?: string[];
  isExpanded: boolean;
  onToggle: () => void;
  isSelected: boolean;
}) {
  const includedItems = details.filter(d => d.included);
  const excludedItems = details.filter(d => !d.included);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`
          w-full flex items-center justify-between gap-2 py-2 px-3 rounded-xl text-sm
          transition-all
          ${isExpanded
            ? 'bg-indigo-50 text-indigo-600'
            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
          }
        `}
      >
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4" />
          <span className="font-medium">
            {isExpanded ? 'Hide coverage details' : 'What\'s included?'}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Included
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {includedItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {excludedItems.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Not included
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {excludedItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                    <XCircle className="w-4 h-4 opacity-40 flex-shrink-0 mt-0.5" />
                    <span className="line-through opacity-60">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ExtrasStep() {
  const { state, dispatch, prevStep, nextStep } = useBooking();
  const {
    drivers,
    searchDates,
    selectedVehicle,
    selectedInsurance,
    calculatedInsurances,
    maxCompletedStep,
  } = state;

  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
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
            Back
          </button>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Choose Your Coverage
          </h2>
          <p className="text-slate-500 mt-1">Select insurance for your rental</p>
        </div>
        <Stepper
          currentStep={4}
          steps={bookingSteps}
          maxCompletedStep={maxCompletedStep}
        />
      </div>

      {calculatedInsurances.length === 0 ? (
        <div className="text-center py-8 text-slate-500 bg-white rounded-[2rem] border border-slate-200 p-6">
          <p>Calculating insurance options...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {calculatedInsurances.map((calculated) => {
            const isSelected = selectedInsurance === calculated.option.id;
            const isInvalid = !calculated.factors.isValid;
            const isExpanded = expandedId === calculated.option.id;
            const option = calculated.option;

            return (
              <div
                key={calculated.option.id}
                onClick={() => !isInvalid && dispatch({ type: 'SET_SELECTED_INSURANCE', payload: calculated.option.id })}
                className={`
                  bg-white rounded-2xl border p-5 transition-all cursor-pointer
                  ${isSelected
                    ? 'border-indigo-600 bg-indigo-50/30 shadow-md shadow-indigo-500/5'
                    : 'border-slate-200 hover:border-slate-300'
                  }
                  ${isInvalid ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {/* Main Row */}
                <div className="flex items-start gap-3">
                  {/* Radio Circle */}
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0
                      ${isSelected ? 'border-indigo-600' : 'border-slate-300'}
                    `}
                  >
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {option.title}
                        </h3>
                        {option.checked && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                            Recommended
                          </span>
                        )}
                        {isInvalid && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Not Available
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-900">
                          {calculated.calculatedPrice.toFixed(0)}
                        </span>
                        <span className="text-sm text-slate-400 ml-1">{currency}</span>
                      </div>
                    </div>

                    {/* Highlights */}
                    {option.highlights && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {option.highlights.map((h, i) => (
                          <span
                            key={i}
                            className={`
                              inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg
                              ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}
                            `}
                          >
                            <Check className="w-3 h-3" />
                            {h}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Deposit & Excess Info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                      {option.deposit === 1 && (
                        <span>Deposit: {option.deposit_price} {currency}</span>
                      )}
                      {option.damage === 1 && (
                        <span>Excess: {option.damage_access} {currency}</span>
                      )}
                      {option.deposit === 0 && option.damage === 0 && (
                        <span className="text-green-600 font-medium">No deposit &middot; Zero excess</span>
                      )}
                    </div>

                    {/* Coverage Details - Expandable */}
                    {option.coverageDetails && !isInvalid && (
                      <CoverageSection
                        details={option.coverageDetails}
                        highlights={option.highlights}
                        isExpanded={isExpanded}
                        onToggle={() => toggleExpanded(option.id)}
                        isSelected={isSelected}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Price Summary */}
      {selectedInsuranceData && (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6">
          <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <Car className="w-4 h-4 text-slate-400" />
            Price Summary
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Vehicle Rental:</span>
              <span className="font-medium text-slate-900">
                {vehicleBasePrice.toFixed(2)} {currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">
                {selectedInsuranceData.option.title}:
              </span>
              <span className="font-medium text-slate-900">
                {insurancePrice.toFixed(2)} {currency}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-200 font-bold text-base">
              <span className="text-slate-900">Total:</span>
              <span className="text-indigo-600">
                {totalPrice.toFixed(2)} {currency}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <Button
        onClick={handleContinue}
        disabled={!selectedInsurance || !isInsuranceValid}
        size="lg"
        className="w-full rounded-xl py-6 bg-slate-900 hover:bg-indigo-600"
      >
        Continue to Confirmation
      </Button>
    </div>
  );
}
