import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import webpush from 'web-push';
import {
  normalizeUserPushSubscriptions,
  shouldRemoveSubscriptionOnError,
  type StoredPushSubscription,
} from '@/lib/push/subscriptions';

// VAPID keys should be generated and stored in env variables
// npx web-push generate-vapid-keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:bilgi@simetri.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);
    // In a real app, check if user is admin

    const { userId, title, body, url } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const subscriptions = normalizeUserPushSubscriptions(userData);
    if (subscriptions.length === 0) {
      return NextResponse.json({ error: 'User has no subscription' }, { status: 404 });
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      icon: '/logos/Simetri-CRM-logo-01.png'
    });

    const results = await Promise.allSettled(
      subscriptions.map((subscription) => webpush.sendNotification(subscription, payload))
    );

    const failedSubscriptions: Array<{ subscription: StoredPushSubscription; reason: unknown }> = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        failedSubscriptions.push({ subscription: subscriptions[index], reason: result.reason });
      }
    });

    const removableEndpoints = new Set(
      failedSubscriptions
        .filter((item) => shouldRemoveSubscriptionOnError(item.reason))
        .map((item) => item.subscription.endpoint)
    );

    if (removableEndpoints.size > 0) {
      const remaining = subscriptions.filter((sub) => !removableEndpoints.has(sub.endpoint));
      await adminDb.collection('users').doc(userId).set(
        {
          pushSubscriptions: remaining,
          pushSubscription: remaining[0] ?? null,
        },
        { merge: true }
      );
    }

    const failed = failedSubscriptions.length;
    const sent = subscriptions.length - failed;

    return NextResponse.json({
      success: failed === 0,
      attempted: subscriptions.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error('Error sending push:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
