import {
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { getCollection } from './firestore';
import type {
  Activity,
  ActivityFormData,
  ActivityType,
  ActivitySource,
  SystemEvent,
  Contact,
  Company,
  Deal,
  WorkOrder,
  Request,
} from '@/lib/types';

const COLLECTION = 'activities';

export const activityService = {
  /**
   * Tum aktiviteleri getirir
   */
  getAll: async (options?: {
    contactId?: string;
    companyId?: string;
    dealId?: string;
    workOrderId?: string;
    requestId?: string;
    type?: ActivityType;
    source?: ActivitySource;
    limitCount?: number;
  }): Promise<Activity[]> => {
    let q = query(
      getCollection<Activity>(COLLECTION),
      orderBy('occurredAt', 'desc')
    );

    if (options?.contactId) {
      q = query(q, where('contactId', '==', options.contactId));
    }
    if (options?.companyId) {
      q = query(q, where('companyId', '==', options.companyId));
    }
    if (options?.dealId) {
      q = query(q, where('dealId', '==', options.dealId));
    }
    if (options?.workOrderId) {
      q = query(q, where('workOrderId', '==', options.workOrderId));
    }
    if (options?.requestId) {
      q = query(q, where('requestId', '==', options.requestId));
    }
    if (options?.type) {
      q = query(q, where('type', '==', options.type));
    }
    if (options?.source) {
      q = query(q, where('source', '==', options.source));
    }
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Kisinin aktivitelerini getirir
   */
  getByContactId: async (
    contactId: string,
    limitCount?: number
  ): Promise<Activity[]> => {
    return activityService.getAll({ contactId, limitCount });
  },

  /**
   * Sirketin aktivitelerini getirir
   */
  getByCompanyId: async (
    companyId: string,
    limitCount?: number
  ): Promise<Activity[]> => {
    return activityService.getAll({ companyId, limitCount });
  },

  /**
   * Deal'in aktivitelerini getirir
   */
  getByDealId: async (
    dealId: string,
    limitCount?: number
  ): Promise<Activity[]> => {
    return activityService.getAll({ dealId, limitCount });
  },

  /**
   * Is Emrinin aktivitelerini getirir
   */
  getByWorkOrderId: async (
    workOrderId: string,
    limitCount?: number
  ): Promise<Activity[]> => {
    return activityService.getAll({ workOrderId, limitCount });
  },

  /**
   * Tek bir aktiviteyi getirir
   */
  getById: async (id: string): Promise<Activity | null> => {
    const docRef = doc(getCollection<Activity>(COLLECTION), id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  /**
   * Kullanici aktivitesi ekler (call, meeting, email, note, file, decision, networking)
   */
  add: async (data: ActivityFormData, userId: string): Promise<string> => {
    const batch = writeBatch(db);

    // Denormalize alanlar icin veri topla
    let contactName: string | null = null;
    let companyName: string | null = null;
    let dealTitle: string | null = null;
    let workOrderTitle: string | null = null;
    let requestTitle: string | null = null;

    if (data.contactId) {
      const contactRef = doc(getCollection<Contact>('contacts'), data.contactId);
      const contactSnap = await getDoc(contactRef);
      if (contactSnap.exists()) {
        const contact = contactSnap.data();
        contactName = contact.fullName;
        // Contact'tan company bilgisini de al (eger companyId verilmediyse)
        if (!data.companyId && contact.companyId) {
          data.companyId = contact.companyId;
          companyName = contact.companyName;
        }
      }
    }

    if (data.companyId && !companyName) {
      const companyRef = doc(getCollection<Company>('companies'), data.companyId);
      const companySnap = await getDoc(companyRef);
      companyName = companySnap.exists() ? companySnap.data().name : null;
    }

    if (data.dealId) {
      const dealRef = doc(getCollection<Deal>('deals'), data.dealId);
      const dealSnap = await getDoc(dealRef);
      if (dealSnap.exists()) {
        const deal = dealSnap.data();
        dealTitle = deal.title;
        if (!data.companyId) {
          data.companyId = deal.companyId;
          companyName = deal.companyName;
        }
      }
    }

    if (data.workOrderId) {
      const workOrderRef = doc(
        getCollection<WorkOrder>('work_orders'),
        data.workOrderId
      );
      const workOrderSnap = await getDoc(workOrderRef);
      if (workOrderSnap.exists()) {
        const workOrder = workOrderSnap.data();
        workOrderTitle = workOrder.title;
        if (!data.companyId) {
          data.companyId = workOrder.companyId;
          companyName = workOrder.companyName;
        }
      }
    }

    if (data.requestId) {
      const requestRef = doc(getCollection<Request>('requests'), data.requestId);
      const requestSnap = await getDoc(requestRef);
      requestTitle = requestSnap.exists() ? requestSnap.data().title : null;
    }

    const now = serverTimestamp() as Timestamp;
    const occurredAt = data.occurredAt
      ? Timestamp.fromDate(data.occurredAt)
      : now;

    // Aktiviteyi olustur
    const activityRef = doc(getCollection<Activity>(COLLECTION));
    batch.set(activityRef, {
      id: activityRef.id,
      contactId: data.contactId ?? null,
      contactName,
      companyId: data.companyId ?? null,
      companyName,
      dealId: data.dealId ?? null,
      dealTitle,
      workOrderId: data.workOrderId ?? null,
      workOrderTitle,
      requestId: data.requestId ?? null,
      requestTitle,
      type: data.type,
      source: 'user' as ActivitySource,
      systemEvent: null,
      summary: data.summary,
      details: data.details ?? null,
      nextAction: data.nextAction ?? null,
      nextActionDate: data.nextActionDate
        ? Timestamp.fromDate(data.nextActionDate)
        : null,
      occurredAt,
      createdAt: now,
      createdBy: userId,
    } as Activity);

    // lastActivityAt guncelle
    if (data.contactId) {
      batch.update(doc(db, 'contacts', data.contactId), {
        lastActivityAt: now,
      });
    }
    if (data.companyId) {
      batch.update(doc(db, 'companies', data.companyId), {
        lastActivityAt: now,
      });
    }
    if (data.dealId) {
      batch.update(doc(db, 'deals', data.dealId), {
        lastActivityAt: now,
      });
    }
    if (data.workOrderId) {
      batch.update(doc(db, 'work_orders', data.workOrderId), {
        lastActivityAt: now,
      });
    }

    // Eger nextAction belirlendiyse, ilgili kaydi guncelle
    if (data.nextAction && data.nextActionDate) {
      if (data.contactId) {
        batch.update(doc(db, 'contacts', data.contactId), {
          nextAction: data.nextAction,
          nextActionDate: Timestamp.fromDate(data.nextActionDate),
        });
      } else if (data.dealId) {
        batch.update(doc(db, 'deals', data.dealId), {
          nextAction: data.nextAction,
          nextActionDate: Timestamp.fromDate(data.nextActionDate),
        });
      } else if (data.companyId) {
        batch.update(doc(db, 'companies', data.companyId), {
          nextAction: data.nextAction,
          nextActionDate: Timestamp.fromDate(data.nextActionDate),
        });
      }
    }

    await batch.commit();
    return activityRef.id;
  },

  /**
   * Sistem aktivitesi ekler (stage change, proposal sent, vb.)
   */
  addSystemActivity: async (
    systemEvent: SystemEvent,
    summary: string,
    options: {
      contactId?: string;
      companyId?: string;
      dealId?: string;
      workOrderId?: string;
      requestId?: string;
      details?: string;
    },
    userId: string
  ): Promise<string> => {
    const batch = writeBatch(db);

    // Denormalize alanlar icin veri topla
    let contactName: string | null = null;
    let companyName: string | null = null;
    let dealTitle: string | null = null;
    let workOrderTitle: string | null = null;
    let requestTitle: string | null = null;
    let contactId = options.contactId ?? null;
    let companyId = options.companyId ?? null;

    if (contactId) {
      const contactRef = doc(getCollection<Contact>('contacts'), contactId);
      const contactSnap = await getDoc(contactRef);
      if (contactSnap.exists()) {
        const contact = contactSnap.data();
        contactName = contact.fullName;
        companyId = companyId ?? contact.companyId;
        companyName = contact.companyName;
      }
    }

    if (options.dealId) {
      const dealRef = doc(getCollection<Deal>('deals'), options.dealId);
      const dealSnap = await getDoc(dealRef);
      if (dealSnap.exists()) {
        const deal = dealSnap.data();
        dealTitle = deal.title;
        companyId = companyId ?? deal.companyId;
        companyName = companyName ?? deal.companyName;
      }
    }

    if (options.workOrderId) {
      const workOrderRef = doc(
        getCollection<WorkOrder>('work_orders'),
        options.workOrderId
      );
      const workOrderSnap = await getDoc(workOrderRef);
      if (workOrderSnap.exists()) {
        const workOrder = workOrderSnap.data();
        workOrderTitle = workOrder.title;
        companyId = companyId ?? workOrder.companyId;
        companyName = companyName ?? workOrder.companyName;
      }
    }

    if (options.requestId) {
      const requestRef = doc(getCollection<Request>('requests'), options.requestId);
      const requestSnap = await getDoc(requestRef);
      requestTitle = requestSnap.exists() ? requestSnap.data().title : null;
    }

    if (companyId && !companyName) {
      const companyRef = doc(getCollection<Company>('companies'), companyId);
      const companySnap = await getDoc(companyRef);
      companyName = companySnap.exists() ? companySnap.data().name : null;
    }

    const now = serverTimestamp() as Timestamp;

    // Sistem aktivitesini olustur
    const activityRef = doc(getCollection<Activity>(COLLECTION));
    batch.set(activityRef, {
      id: activityRef.id,
      contactId,
      contactName,
      companyId,
      companyName,
      dealId: options.dealId ?? null,
      dealTitle,
      workOrderId: options.workOrderId ?? null,
      workOrderTitle,
      requestId: options.requestId ?? null,
      requestTitle,
      type: 'system' as ActivityType,
      source: 'system' as ActivitySource,
      systemEvent,
      summary,
      details: options.details ?? null,
      nextAction: null,
      nextActionDate: null,
      occurredAt: now,
      createdAt: now,
      createdBy: userId,
    } as Activity);

    // lastActivityAt guncelle
    if (contactId) {
      batch.update(doc(db, 'contacts', contactId), {
        lastActivityAt: now,
      });
    }
    if (companyId) {
      batch.update(doc(db, 'companies', companyId), {
        lastActivityAt: now,
      });
    }
    if (options.dealId) {
      batch.update(doc(db, 'deals', options.dealId), {
        lastActivityAt: now,
      });
    }
    if (options.workOrderId) {
      batch.update(doc(db, 'work_orders', options.workOrderId), {
        lastActivityAt: now,
      });
    }

    await batch.commit();
    return activityRef.id;
  },

  /**
   * Aktiviteyi siler
   */
  delete: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<Activity>(COLLECTION), id);
    await deleteDoc(docRef);
  },

  /**
   * Son aktiviteleri getirir (dashboard icin)
   */
  getRecent: async (limitCount: number = 20): Promise<Activity[]> => {
    const q = query(
      getCollection<Activity>(COLLECTION),
      orderBy('occurredAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Belirli bir tarihten sonraki aktiviteleri getirir
   */
  getAfterDate: async (
    date: Date,
    options?: {
      contactId?: string;
      companyId?: string;
      dealId?: string;
      workOrderId?: string;
    }
  ): Promise<Activity[]> => {
    let q = query(
      getCollection<Activity>(COLLECTION),
      where('occurredAt', '>=', Timestamp.fromDate(date)),
      orderBy('occurredAt', 'desc')
    );

    if (options?.contactId) {
      q = query(q, where('contactId', '==', options.contactId));
    }
    if (options?.companyId) {
      q = query(q, where('companyId', '==', options.companyId));
    }
    if (options?.dealId) {
      q = query(q, where('dealId', '==', options.dealId));
    }
    if (options?.workOrderId) {
      q = query(q, where('workOrderId', '==', options.workOrderId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },
};
