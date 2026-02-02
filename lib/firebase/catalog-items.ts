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
} from 'firebase/firestore';
import { getCollection } from './firestore';
import type { CatalogItem, CatalogItemFormData, CatalogItemType, Currency } from '@/lib/types';

const COLLECTION = 'catalog_items';

export const catalogItemService = {
  /**
   * Tum katalog kalemlerini getirir
   */
  getAll: async (options?: {
    type?: CatalogItemType;
    currency?: Currency;
    isActive?: boolean;
    limitCount?: number;
  }): Promise<CatalogItem[]> => {
    let q = query(
      getCollection<CatalogItem>(COLLECTION),
      orderBy('name', 'asc')
    );

    if (options?.type) {
      q = query(q, where('type', '==', options.type));
    }
    if (options?.currency) {
      q = query(q, where('currency', '==', options.currency));
    }
    if (options?.isActive !== undefined) {
      q = query(q, where('isActive', '==', options.isActive));
    }
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Aktif katalog kalemlerini getirir
   */
  getActive: async (options?: {
    type?: CatalogItemType;
    currency?: Currency;
  }): Promise<CatalogItem[]> => {
    return catalogItemService.getAll({
      ...options,
      isActive: true,
    });
  },

  /**
   * Tek bir katalog kalemini getirir
   */
  getById: async (id: string): Promise<CatalogItem | null> => {
    const docRef = doc(getCollection<CatalogItem>(COLLECTION), id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  /**
   * Yeni katalog kalemi ekler
   */
  add: async (data: CatalogItemFormData, userId: string): Promise<string> => {
    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection<CatalogItem>(COLLECTION), {
      name: data.name,
      type: data.type,
      unit: data.unit,
      defaultUnitPriceMinor: data.defaultUnitPriceMinor,
      currency: data.currency,
      taxRate: data.taxRate,
      isActive: data.isActive ?? true,
      description: data.description ?? null,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    } as CatalogItem);
    return docRef.id;
  },

  /**
   * Katalog kalemi gunceller
   */
  update: async (
    id: string,
    data: Partial<CatalogItemFormData>,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<CatalogItem>(COLLECTION), id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Katalog kalemini aktif/pasif yapar
   */
  setActive: async (
    id: string,
    isActive: boolean,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<CatalogItem>(COLLECTION), id);
    await updateDoc(docRef, {
      isActive,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Katalog kalemini siler
   */
  delete: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<CatalogItem>(COLLECTION), id);
    await deleteDoc(docRef);
  },

  /**
   * Isim ile arama yapar
   */
  searchByName: async (searchTerm: string): Promise<CatalogItem[]> => {
    // Firestore'da full-text search yok, basit prefix araması
    // Daha gelismis arama icin Algolia veya benzeri kullanilabilir
    const q = query(
      getCollection<CatalogItem>(COLLECTION),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);

    const term = searchTerm.toLowerCase();
    return snapshot.docs
      .map((doc) => doc.data())
      .filter((item) => item.name.toLowerCase().includes(term));
  },
};
