'use client';

import { useBooking } from './BookingContext';
import { SearchStep } from './steps/SearchStep';
import { VehicleSelectionStep } from './steps/VehicleSelectionStep';
import { DriverDataStep } from './steps/DriverDataStep';
import { ExtrasStep } from './steps/ExtrasStep';
import { ConfirmOrderStep } from './steps/ConfirmOrderStep';

export const bookingSteps = [
  { label: 'Search', description: 'Find vehicles' },
  { label: 'Select', description: 'Choose car' },
  { label: 'Details', description: 'Your info' },
  { label: 'Extras', description: 'Insurance' },
  { label: 'Confirm', description: 'Review & pay' },
];

export function BookingWizard() {
  const { state } = useBooking();
  const { currentStep } = state;

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
    <div className="min-h-screen bg-slate-50/50">
      <main className="max-w-5xl mx-auto px-6 md:px-12 py-8 md:py-12">
        {renderStep()}
      </main>
    </div>
  );
}
