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
import type { Contact, ContactFormData, Company } from '@/lib/types';

const COLLECTION = 'contacts';

export const contactService = {
  /**
   * Tum kisileri getirir
   */
  getAll: async (options?: {
    companyId?: string;
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
   * Şirketin kisilerini getirir
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
    // Şirket adini al (denormalizasyon icin)
    const companyRef = doc(getCollection<Company>('companies'), data.companyId);
    const companySnap = await getDoc(companyRef);
    const companyName = companySnap.exists() ? companySnap.data().name : '';

    // Eger isPrimary true ise, diger primary'leri kaldir
    if (data.isPrimary) {
      await contactService.clearPrimaryForCompany(data.companyId);
    }

    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection<Contact>(COLLECTION), {
      companyId: data.companyId,
      companyName,
      fullName: data.fullName,
      title: data.title ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      isPrimary: data.isPrimary ?? false,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    } as Contact);
    return docRef.id;
  },

  /**
   * Kisi günceller
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
      if (existingContact) {
        await contactService.clearPrimaryForCompany(existingContact.companyId, id);
      }
    }

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

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
   * Şirketin primary contact'ini getirir
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
   * Şirketteki diger primary'leri kaldirir
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
   * Kisi adini ve iliskili dokumanlardaki denormalize alanlari günceller
   */
  updateName: async (
    id: string,
    newName: string,
    userId: string
  ): Promise<void> => {
    const batch = writeBatch(db);
    const contactRef = doc(db, COLLECTION, id);

    // Kisiyi güncelle
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
};
