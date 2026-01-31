import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
      setLoading(false);
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      setLoading(false);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      setLoading(false);
    }
  }

  async function subscribe() {
    if (!isSupported || !PUBLIC_KEY) {
      console.error('Push notifications not supported or missing key');
      return;
    }

    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      });

      setSubscription(sub);
      await saveSubscription(sub);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      setLoading(false);
      return false;
    }
  }

  async function saveSubscription(sub: PushSubscription) {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription: sub }),
      });
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  }

  return {
    isSupported,
    subscription,
    subscribe,
    loading,
  };
}
