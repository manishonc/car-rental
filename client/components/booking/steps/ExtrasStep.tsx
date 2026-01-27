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
  Car
} from 'lucide-react';
import { useBooking } from '../BookingContext';
import { insuranceOptions, CoverageDetail } from '@/lib/config/insurance';
import { calculateAllInsurancePremiums } from '@/lib/utils/insurance-calculator';

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
      {/* Toggle Button - More prominent and mobile-friendly */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`
          w-full flex items-center justify-between gap-2 py-2 px-3 rounded-lg text-sm
          transition-all
          ${isExpanded 
            ? 'bg-primary/10 text-primary' 
            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
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
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Included Items */}
          <div>
            <p className="text-xs font-medium text-green-600 mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Included
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {includedItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Excluded Items */}
          {excludedItems.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Not included
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {excludedItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
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

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Header - Standalone, not in a card */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Choose Your Coverage</h2>
          <p className="text-sm text-muted-foreground">
            Select insurance for your rental
          </p>
        </div>
      </div>

      {calculatedInsurances.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-border p-6">
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
                  bg-card rounded-xl border p-4 transition-all cursor-pointer
                  ${isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40'
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
                      ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'}
                    `}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {option.title}
                        </h3>
                        {option.checked && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                            Recommended
                          </span>
                        )}
                        {isInvalid && (
                          <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Not Available
                          </span>
                        )}
                      </div>
                      
                      {/* Price - Mobile */}
                      <div className="text-right">
                        <span className="text-lg font-bold text-foreground">
                          {calculated.calculatedPrice.toFixed(0)}
                        </span>
                        <span className="text-sm text-muted-foreground ml-1">{currency}</span>
                      </div>
                    </div>

                    {/* Highlights */}
                    {option.highlights && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {option.highlights.map((h, i) => (
                          <span 
                            key={i} 
                            className={`
                              inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md
                              ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                            `}
                          >
                            <Check className="w-3 h-3" />
                            {h}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Deposit & Excess Info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      {option.deposit === 1 && (
                        <span>Deposit: {option.deposit_price} {currency}</span>
                      )}
                      {option.damage === 1 && (
                        <span>Excess: {option.damage_access} {currency}</span>
                      )}
                      {option.deposit === 0 && option.damage === 0 && (
                        <span className="text-green-600 font-medium">✓ No deposit • Zero excess</span>
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
        <div className="bg-card rounded-xl border border-border p-4">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2 text-sm">
            <Car className="w-4 h-4 text-muted-foreground" />
            Price Summary
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Vehicle Rental:</span>
              <span className="font-medium text-foreground">
                {vehicleBasePrice.toFixed(2)} {currency}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                {selectedInsuranceData.option.title}:
              </span>
              <span className="font-medium text-foreground">
                {insurancePrice.toFixed(2)} {currency}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border/50 font-bold text-base">
              <span className="text-foreground">Total:</span>
              <span className="text-primary">
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
        className="w-full rounded-xl py-6"
      >
        Continue to Confirmation
      </Button>
    </div>
  );
}
