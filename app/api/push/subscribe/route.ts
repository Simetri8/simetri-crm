import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import {
  isStoredPushSubscription,
  normalizeUserPushSubscriptions,
  upsertPushSubscription,
} from '@/lib/push/subscriptions';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { subscription } = await request.json();

    if (!isStoredPushSubscription(subscription)) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 400 });
    }

    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const existingSubscriptions = normalizeUserPushSubscriptions(userSnap.data());
    const nextSubscriptions = upsertPushSubscription(existingSubscriptions, subscription);

    await userRef.set(
      {
        // Backward compatibility: keep latest subscription in legacy field.
        pushSubscription: subscription,
        pushSubscriptions: nextSubscriptions,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, totalSubscriptions: nextSubscriptions.length });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
