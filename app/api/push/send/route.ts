import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import webpush from 'web-push';

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

    if (!userData?.pushSubscription) {
      return NextResponse.json({ error: 'User has no subscription' }, { status: 404 });
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      icon: '/logos/Simetri-CRM-logo-01.png'
    });

    await webpush.sendNotification(userData.pushSubscription, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending push:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
