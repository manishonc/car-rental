'use client';

import { Stepper } from '@/components/ui/stepper';
import { useBooking } from './BookingContext';
import { SearchStep } from './steps/SearchStep';
import { VehicleSelectionStep } from './steps/VehicleSelectionStep';
import { DriverDataStep } from './steps/DriverDataStep';
import { ExtrasStep } from './steps/ExtrasStep';
import { ConfirmOrderStep } from './steps/ConfirmOrderStep';

const steps = [
  { label: 'Search', description: 'Find vehicles' },
  { label: 'Select', description: 'Choose car' },
  { label: 'Details', description: 'Your info' },
  { label: 'Extras', description: 'Insurance' },
  { label: 'Confirm', description: 'Review & pay' },
];

export function BookingWizard() {
  const { state, goToStep } = useBooking();
  const { currentStep, maxCompletedStep } = state;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SearchStep />;
      case 2:
        return <VehicleSelectionStep />;
      case 3:
        return <DriverDataStep />;
      case 4:
        return <ExtrasStep />;
      case 5:
        return <ConfirmOrderStep />;
      default:
        return <SearchStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Car Rental</h1>
          <p className="text-muted-foreground">
            Find and book your perfect vehicle in minutes
          </p>
        </header>

        {/* Stepper */}
        <div className="mb-8 md:mb-10">
          <Stepper
            currentStep={currentStep}
            steps={steps}
            onStepClick={goToStep}
            maxCompletedStep={maxCompletedStep}
          />
        </div>

        {/* Step Content */}
        <div className="mt-8">{renderStep()}</div>
      </div>
    </div>
  );
}
