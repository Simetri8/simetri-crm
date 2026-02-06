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
import type { Contact, ContactFormData, ContactStage, ContactSource, Company } from '@/lib/types';

const COLLECTION = 'contacts';

export const contactService = {
  /**
   * Tum kisileri getirir
   */
  getAll: async (options?: {
    companyId?: string;
    stage?: ContactStage;
    stages?: ContactStage[];
    source?: ContactSource;
    ownerId?: string;
    isPrimary?: boolean;
    limitCount?: number;
  }): Promise<Contact[]> => {
    let q = query(
      getCollection<Contact>(COLLECTION),
      orderBy('fullName', 'asc')
    );

    if (options?.companyId) {
      q = query(q, where('companyId', '==', options.companyId));
    }
    if (options?.stage) {
      q = query(q, where('stage', '==', options.stage));
    }
    if (options?.stages && options.stages.length > 0) {
      q = query(q, where('stage', 'in', options.stages));
    }
    if (options?.source) {
      q = query(q, where('source', '==', options.source));
    }
    if (options?.ownerId) {
      q = query(q, where('ownerId', '==', options.ownerId));
    }
    if (options?.isPrimary !== undefined) {
      q = query(q, where('isPrimary', '==', options.isPrimary));
    }
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Sirketin kisilerini getirir
   */
  getByCompanyId: async (companyId: string): Promise<Contact[]> => {
    const q = query(
      getCollection<Contact>(COLLECTION),
      where('companyId', '==', companyId),
      orderBy('isPrimary', 'desc'),
      orderBy('fullName', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Tek bir kisiyi getirir
   */
  getById: async (id: string): Promise<Contact | null> => {
    const docRef = doc(getCollection<Contact>(COLLECTION), id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  /**
   * Yeni kisi ekler
   */
  add: async (data: ContactFormData, userId: string): Promise<string> => {
    // Sirket adini al (denormalizasyon icin)
    let companyName: string | null = null;
    if (data.companyId) {
      const companyRef = doc(getCollection<Company>('companies'), data.companyId);
      const companySnap = await getDoc(companyRef);
      companyName = companySnap.exists() ? companySnap.data().name : null;

      // Eger isPrimary true ise, diger primary'leri kaldir
      if (data.isPrimary) {
        await contactService.clearPrimaryForCompany(data.companyId);
      }
    }

    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection<Contact>(COLLECTION), {
      companyId: data.companyId ?? null,
      companyName,
      fullName: data.fullName,
      title: data.title ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      stage: data.stage ?? 'new',
      source: data.source ?? null,
      sourceDetail: data.sourceDetail ?? null,
      isPrimary: data.isPrimary ?? false,
      notes: data.notes ?? null,
      tags: data.tags ?? [],
      nextAction: data.nextAction ?? null,
      nextActionDate: data.nextActionDate
        ? Timestamp.fromDate(data.nextActionDate)
        : null,
      ownerId: data.ownerId ?? userId,
      lastActivityAt: null,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    } as Contact);
    return docRef.id;
  },

  /**
   * Kisi gunceller
   */
  update: async (
    id: string,
    data: Partial<ContactFormData>,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Contact>(COLLECTION), id);

    // Eger isPrimary true yapiliyorsa, diger primary'leri kaldir
    if (data.isPrimary === true) {
      const existingContact = await contactService.getById(id);
      if (existingContact?.companyId) {
        await contactService.clearPrimaryForCompany(existingContact.companyId, id);
      }
    }

    // companyId degistiyse companyName'i de guncelle
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (data.companyId !== undefined) {
      if (data.companyId) {
        const companyRef = doc(getCollection<Company>('companies'), data.companyId);
        const companySnap = await getDoc(companyRef);
        updateData.companyName = companySnap.exists() ? companySnap.data().name : null;
      } else {
        updateData.companyName = null;
      }
    }

    // Tarih alanlarini Timestamp'e cevir
    if (data.nextActionDate !== undefined) {
      updateData.nextActionDate = data.nextActionDate
        ? Timestamp.fromDate(data.nextActionDate)
        : null;
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Kisiyi siler
   */
  delete: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<Contact>(COLLECTION), id);
    await deleteDoc(docRef);
  },

  /**
   * Contact stage gunceller
   */
  updateStage: async (
    id: string,
    stage: ContactStage,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Contact>(COLLECTION), id);
    await updateDoc(docRef, {
      stage,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Next action gunceller
   */
  updateNextAction: async (
    id: string,
    nextAction: string | null,
    nextActionDate: Date | null,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Contact>(COLLECTION), id);
    await updateDoc(docRef, {
      nextAction,
      nextActionDate: nextActionDate ? Timestamp.fromDate(nextActionDate) : null,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * lastActivityAt gunceller (aktivite eklendiginde cagirilir)
   */
  updateLastActivity: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<Contact>(COLLECTION), id);
    await updateDoc(docRef, {
      lastActivityAt: serverTimestamp(),
    });
  },

  /**
   * Sirketin primary contact'ini getirir
   */
  getPrimaryByCompanyId: async (companyId: string): Promise<Contact | null> => {
    const q = query(
      getCollection<Contact>(COLLECTION),
      where('companyId', '==', companyId),
      where('isPrimary', '==', true),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0 ? snapshot.docs[0].data() : null;
  },

  /**
   * Sirketteki diger primary'leri kaldirir
   */
  clearPrimaryForCompany: async (
    companyId: string,
    excludeId?: string
  ): Promise<void> => {
    const q = query(
      getCollection<Contact>(COLLECTION),
      where('companyId', '==', companyId),
      where('isPrimary', '==', true)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      if (docSnap.id !== excludeId) {
        batch.update(doc(db, COLLECTION, docSnap.id), { isPrimary: false });
      }
    });
    await batch.commit();
  },

  /**
   * Kisi adini ve iliskili dokumanlardaki denormalize alanlari gunceller
   */
  updateName: async (
    id: string,
    newName: string,
    userId: string
  ): Promise<void> => {
    const batch = writeBatch(db);
    const contactRef = doc(db, COLLECTION, id);

    // Kisiyi guncelle
    batch.update(contactRef, {
      fullName: newName,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // Deals (primaryContactName)
    const dealsQuery = query(
      getCollection<{ primaryContactId: string }>('deals'),
      where('primaryContactId', '==', id)
    );
    const dealsSnapshot = await getDocs(dealsQuery);
    dealsSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'deals', docSnap.id), { primaryContactName: newName });
    });

    // Activities (contactName)
    const activitiesQuery = query(
      getCollection<{ contactId: string }>('activities'),
      where('contactId', '==', id)
    );
    const activitiesSnapshot = await getDocs(activitiesQuery);
    activitiesSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'activities', docSnap.id), { contactName: newName });
    });

    // Requests (contactName)
    const requestsQuery = query(
      getCollection<{ contactId: string }>('requests'),
      where('contactId', '==', id)
    );
    const requestsSnapshot = await getDocs(requestsQuery);
    requestsSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'requests', docSnap.id), { contactName: newName });
    });

    await batch.commit();
  },

  /**
   * E-posta ile kisi arar
   */
  searchByEmail: async (email: string): Promise<Contact[]> => {
    const q = query(
      getCollection<Contact>(COLLECTION),
      where('email', '==', email)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Geciken takipleri getirir (nextActionDate < bugun)
   */
  getOverdueFollowUps: async (options?: {
    ownerId?: string;
    limitCount?: number;
  }): Promise<Contact[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let q = query(
      getCollection<Contact>(COLLECTION),
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
  }): Promise<Contact[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let q = query(
      getCollection<Contact>(COLLECTION),
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

  /**
   * Belirli stage'deki kisileri getirir
   */
  getByStage: async (
    stage: ContactStage,
    options?: { limitCount?: number }
  ): Promise<Contact[]> => {
    let q = query(
      getCollection<Contact>(COLLECTION),
      where('stage', '==', stage),
      orderBy('createdAt', 'desc')
    );

    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Son 7 gunde eklenen yeni kisileri getirir (networking paneli icin)
   */
  getRecentNew: async (options?: {
    limitCount?: number;
  }): Promise<Contact[]> => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    let q = query(
      getCollection<Contact>(COLLECTION),
      where('stage', 'in', ['new', 'networking']),
      where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('createdAt', 'desc')
    );

    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },
};
