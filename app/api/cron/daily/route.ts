import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Resend } from 'resend';
import webpush from 'web-push';
import { differenceInDays } from 'date-fns';

type DateField = { toDate: () => Date };
type CustomerSnapshotData = {
  name?: string;
  company?: string;
  temperature?: string;
  lastContactDate?: DateField;
};
type ProjectSnapshotData = {
  name?: string;
  targetEndDate?: DateField;
};
type StoredPushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};
type UserSnapshotData = {
  pushSubscription?: StoredPushSubscription | null;
};

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Web Push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:bilgi@simetri.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function GET() {
  // Verify Cron Secret (optional but recommended)
  // const authHeader = request.headers.get('Authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    console.log('Starting daily cron job...');
    const now = new Date();
    const customersRef = adminDb.collection('customers');
    const projectsRef = adminDb.collection('projects');
    const usersRef = adminDb.collection('users');

    // 1. Update Customer Temperatures
    const customersSnapshot = await customersRef.get();
    const coldCustomers: Array<{ id: string } & CustomerSnapshotData> = [];
    const warmCustomers: Array<{ id: string } & CustomerSnapshotData> = [];
    const updates: Promise<unknown>[] = [];

    customersSnapshot.forEach((doc) => {
      const data = doc.data() as CustomerSnapshotData;
      if (data.lastContactDate) {
        const lastContact = data.lastContactDate.toDate();
        const days = differenceInDays(now, lastContact);
        let newTemp = data.temperature;

        if (days > 30) {
          newTemp = 'cold';
          coldCustomers.push({ id: doc.id, ...data });
        } else if (days > 7) {
          newTemp = 'warm';
          warmCustomers.push({ id: doc.id, ...data });
        } else {
          newTemp = 'hot';
        }

        if (newTemp !== data.temperature) {
          updates.push(doc.ref.update({ temperature: newTemp, updatedAt: new Date() }));
        }
      }
    });

    await Promise.all(updates);
    console.log(`Updated ${updates.length} customer temperatures.`);

    // 2. Check Overdue Projects
    const projectsSnapshot = await projectsRef.where('status', '==', 'active').get();
    const overdueProjects: Array<{ id: string } & ProjectSnapshotData> = [];

    projectsSnapshot.forEach((doc) => {
      const data = doc.data() as ProjectSnapshotData;
      if (data.targetEndDate) {
        const targetDate = data.targetEndDate.toDate();
        if (differenceInDays(now, targetDate) > 0) {
          overdueProjects.push({ id: doc.id, ...data });
        }
      }
    });

    // 3. Prepare Report
    const hasIssues = coldCustomers.length > 0 || overdueProjects.length > 0;
    
    if (hasIssues) {
      const emailBody = `
        <h1>Günlük Simetri Raporu</h1>
        
        ${coldCustomers.length > 0 ? `
          <h2>⚠️ Soğuyan Müşteriler (${coldCustomers.length})</h2>
          <ul>
            ${coldCustomers.map(c => `<li>${c.name} (${c.company}) - 30+ gündür iletişim yok</li>`).join('')}
          </ul>
        ` : ''}

        ${overdueProjects.length > 0 ? `
          <h2>⏰ Geciken Projeler (${overdueProjects.length})</h2>
          <ul>
            ${overdueProjects.map(p => `<li>${p.name} - Hedef: ${p.targetEndDate?.toDate().toLocaleDateString() ?? '-'}</li>`).join('')}
          </ul>
        ` : ''}
      `;

      // 4. Send Email
      if (process.env.ADMIN_EMAIL) {
        await resend.emails.send({
          from: 'Simetri CRM <onboarding@resend.dev>', // Update with verified domain
          to: process.env.ADMIN_EMAIL,
          subject: `Günlük Rapor: ${coldCustomers.length} Müşteri, ${overdueProjects.length} Proje`,
          html: emailBody,
        });
        console.log('Email report sent.');
      }

      // 5. Send Push Notifications
      const usersSnapshot = await usersRef.get();
      const pushPromises: Promise<unknown>[] = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as UserSnapshotData;
        if (userData.pushSubscription) {
          const payload = JSON.stringify({
            title: 'Günlük Rapor Hazır',
            body: `${coldCustomers.length} müşteri ilgi bekliyor, ${overdueProjects.length} proje gecikmede.`,
            url: '/dashboard',
          });
          
          pushPromises.push(
            webpush.sendNotification(userData.pushSubscription, payload)
              .catch(err => console.error(`Push failed for user ${doc.id}:`, err))
          );
        }
      });

      await Promise.all(pushPromises);
      console.log(`Sent ${pushPromises.length} push notifications.`);
    }

    return NextResponse.json({ 
      success: true, 
      updates: updates.length, 
      coldCustomers: coldCustomers.length, 
      overdueProjects: overdueProjects.length 
    });

  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
