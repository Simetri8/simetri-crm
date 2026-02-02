import { Timestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  pushSubscription?: PushSubscriptionJSON | null;
  createdAt: Timestamp;
};
