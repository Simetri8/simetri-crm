import { differenceInDays } from 'date-fns';
import { CustomerTemperature } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

export function calculateTemperature(lastContactDate: Timestamp | null | Date): CustomerTemperature {
  if (!lastContactDate) return 'cold'; // Default to cold if no contact

  const date = lastContactDate instanceof Timestamp ? lastContactDate.toDate() : lastContactDate;
  const daysDiff = differenceInDays(new Date(), date);

  if (daysDiff < 7) return 'hot';
  if (daysDiff <= 30) return 'warm';
  return 'cold';
}

export const TEMPERATURE_COLORS: Record<CustomerTemperature, string> = {
  hot: 'bg-red-500',
  warm: 'bg-amber-500',
  cold: 'bg-blue-500',
};

export const TEMPERATURE_LABELS: Record<CustomerTemperature, string> = {
  hot: 'Sicak (< 7 Gun)',
  warm: 'Ilik (7-30 Gun)',
  cold: 'Soguk (> 30 Gun)',
};
