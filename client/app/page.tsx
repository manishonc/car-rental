'use client';

import { BookingProvider, BookingWizard } from '@/components/booking';

export default function Home() {
  return (
    <BookingProvider>
      <BookingWizard />
    </BookingProvider>
  );
}
