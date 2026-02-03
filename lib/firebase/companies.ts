import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
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
import type { Company, CompanyFormData, CompanyStatus } from '@/lib/types';

const COLLECTION = 'companies';

export const companyService = {
  /**
   * Tum Şirketleri getirir
   */
  getAll: async (options?: {
    status?: CompanyStatus;
    ownerId?: string;
    isArchived?: boolean;
    limitCount?: number;
  }): Promise<Company[]> => {
    let q = query(
      getCollection<Company>(COLLECTION),
      orderBy('lastActivityAt', 'desc')
    );

    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }
    if (options?.ownerId) {
      q = query(q, where('ownerId', '==', options.ownerId));
    }
    if (options?.isArchived !== undefined) {
      q = query(q, where('isArchived', '==', options.isArchived));
    }
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Tek bir Şirketi getirir
   */
  getById: async (id: string): Promise<Company | null> => {
    const docRef = doc(getCollection<Company>(COLLECTION), id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  /**
   * Yeni Şirket ekler
   */
  add: async (data: CompanyFormData, userId: string): Promise<string> => {
    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection<Company>(COLLECTION), {
      ...data,
      nextAction: data.nextAction ?? null,
      nextActionDate: data.nextActionDate
        ? Timestamp.fromDate(data.nextActionDate)
        : null,
      ownerId: data.ownerId ?? userId,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      isArchived: false,
    } as Company);
    return docRef.id;
  },

  /**
   * Şirket günceller
   */
  update: async (
    id: string,
    data: Partial<CompanyFormData>,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Company>(COLLECTION), id);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    // Tarih alanlarini Timestamp'e cevir
    if (data.nextActionDate !== undefined) {
      updateData.nextActionDate = data.nextActionDate
        ? Timestamp.fromDate(data.nextActionDate)
        : null;
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Şirketi arsivler (soft delete)
   */
  archive: async (id: string, userId: string): Promise<void> => {
    const docRef = doc(getCollection<Company>(COLLECTION), id);
    await updateDoc(docRef, {
      isArchived: true,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Şirketi kalici olarak siler
   */
  delete: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<Company>(COLLECTION), id);
    await deleteDoc(docRef);
  },

  /**
   * Next action günceller
   */
  updateNextAction: async (
    id: string,
    nextAction: string | null,
    nextActionDate: Date | null,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Company>(COLLECTION), id);
    await updateDoc(docRef, {
      nextAction,
      nextActionDate: nextActionDate ? Timestamp.fromDate(nextActionDate) : null,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * lastActivityAt günceller (aktivite eklendiginde cagirilir)
   */
  updateLastActivity: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<Company>(COLLECTION), id);
    await updateDoc(docRef, {
      lastActivityAt: serverTimestamp(),
    });
  },

  /**
   * Şirket adini ve iliskili dokumanlardalci denormalize alanlari günceller
   */
  updateName: async (
    id: string,
    newName: string,
    userId: string
  ): Promise<void> => {
    const batch = writeBatch(db);
    const companyRef = doc(db, COLLECTION, id);

    // Şirketi güncelle
    batch.update(companyRef, {
      name: newName,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // Contacts
    const contactsQuery = query(
      getCollection<{ companyId: string }>('contacts'),
      where('companyId', '==', id)
    );
    const contactsSnapshot = await getDocs(contactsQuery);
    contactsSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'contacts', docSnap.id), { companyName: newName });
    });

    // Deals
    const dealsQuery = query(
      getCollection<{ companyId: string }>('deals'),
      where('companyId', '==', id)
    );
    const dealsSnapshot = await getDocs(dealsQuery);
    dealsSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'deals', docSnap.id), { companyName: newName });
    });

    // WorkOrders
    const workOrdersQuery = query(
      getCollection<{ companyId: string }>('work_orders'),
      where('companyId', '==', id)
    );
    const workOrdersSnapshot = await getDocs(workOrdersQuery);
    workOrdersSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'work_orders', docSnap.id), { companyName: newName });
    });

    // Proposals
    const proposalsQuery = query(
      getCollection<{ companyId: string }>('proposals'),
      where('companyId', '==', id)
    );
    const proposalsSnapshot = await getDocs(proposalsQuery);
    proposalsSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'proposals', docSnap.id), { companyName: newName });
    });

    // Activities
    const activitiesQuery = query(
      getCollection<{ companyId: string }>('activities'),
      where('companyId', '==', id)
    );
    const activitiesSnapshot = await getDocs(activitiesQuery);
    activitiesSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'activities', docSnap.id), { companyName: newName });
    });

    await batch.commit();
  },

  /**
   * Geciken takipleri getirir (nextActionDate < bugun)
   */
  getOverdueFollowUps: async (options?: {
    ownerId?: string;
    limitCount?: number;
  }): Promise<Company[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let q = query(
      getCollection<Company>(COLLECTION),
      where('isArchived', '==', false),
      where('nextActionDate', '<', Timestamp.fromDate(today)),
      orderBy('nextActionDate', 'asc')
    );

    if (options?.ownerId) {
      q = query(q, where('ownerId', '==', options.ownerId));
    }
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Bugunun takiplerini getirir (nextActionDate == bugun)
   */
  getTodayFollowUps: async (options?: {
    ownerId?: string;
    limitCount?: number;
  }): Promise<Company[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let q = query(
      getCollection<Company>(COLLECTION),
      where('isArchived', '==', false),
      where('nextActionDate', '>=', Timestamp.fromDate(today)),
      where('nextActionDate', '<', Timestamp.fromDate(tomorrow)),
      orderBy('nextActionDate', 'asc')
    );

    if (options?.ownerId) {
      q = query(q, where('ownerId', '==', options.ownerId));
    }
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },
};
