import { CommunicationType } from '@/lib/types';

export const COMMUNICATION_TYPE_LABELS: Record<CommunicationType, string> = {
  phone: 'Telefon',
  email: 'E-posta',
  meeting: 'Toplanti',
  other: 'Diger',
};

export const COMMUNICATION_TYPE_ICONS: Record<CommunicationType, string> = {
  phone: 'Phone',
  email: 'Mail',
  meeting: 'Users',
  other: 'MessageSquare',
};
