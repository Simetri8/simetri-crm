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
import { activityService } from './activities';
import type { Company, CompanyFormData, CompanyStatus } from '@/lib/types';

const COLLECTION = 'companies';

function normalizeNextAction(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function hasNextActionChanged(
  oldAction: string | null,
  oldDate: Date | null,
  newAction: string | null,
  newDate: Date | null
): boolean {
  const oldMs = oldDate?.getTime() ?? null;
  const newMs = newDate?.getTime() ?? null;
  return oldAction !== newAction || oldMs !== newMs;
}

function formatNextActionDateForLog(date: Date | null): string {
  return date ? date.toLocaleString('tr-TR') : 'Yok';
}

function buildNextActionUpdateDetails(
  oldAction: string | null,
  oldDate: Date | null,
  newAction: string | null,
  newDate: Date | null
): string {
  return [
    `Önceki aksiyon: ${oldAction ?? 'Yok'}`,
    `Önceki tarih: ${formatNextActionDateForLog(oldDate)}`,
    `Yeni aksiyon: ${newAction ?? 'Yok'}`,
    `Yeni tarih: ${formatNextActionDateForLog(newDate)}`,
  ].join('\n');
}

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
      address: data.address ?? null,
      website: data.website ?? null,
      source: data.source ?? null,
      sourceDetail: data.sourceDetail ?? null,
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
    const shouldTrackNextAction =
      data.nextAction !== undefined || data.nextActionDate !== undefined;
    let existingCompany: Company | null = null;

    if (shouldTrackNextAction) {
      const currentSnap = await getDoc(docRef);
      existingCompany = currentSnap.exists() ? currentSnap.data() : null;
    }

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
    if (data.nextAction !== undefined) {
      updateData.nextAction = normalizeNextAction(data.nextAction);
    }
    if (data.website !== undefined) {
      updateData.website = data.website ?? null;
    }
    if (data.address !== undefined) {
      updateData.address = data.address ?? null;
    }

    await updateDoc(docRef, updateData);

    if (shouldTrackNextAction && existingCompany) {
      const oldAction = existingCompany.nextAction ?? null;
      const oldDate = existingCompany.nextActionDate?.toDate() ?? null;
      const newAction =
        data.nextAction !== undefined
          ? normalizeNextAction(data.nextAction)
          : oldAction;
      const newDate =
        data.nextActionDate !== undefined ? data.nextActionDate ?? null : oldDate;

      if (hasNextActionChanged(oldAction, oldDate, newAction, newDate)) {
        try {
          await activityService.addSystemActivity(
            'next_action_updated',
            'Şirket sonraki adımı güncellendi',
            {
              companyId: id,
              details: buildNextActionUpdateDetails(
                oldAction,
                oldDate,
                newAction,
                newDate
              ),
            },
            userId
          );
        } catch (error) {
          console.error('Next action activity log error (company update):', error);
        }
      }
    }
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
    const currentSnap = await getDoc(docRef);
    const currentData = currentSnap.exists() ? currentSnap.data() : null;
    const normalizedNextAction = normalizeNextAction(nextAction);

    await updateDoc(docRef, {
      nextAction: normalizedNextAction,
      nextActionDate: nextActionDate ? Timestamp.fromDate(nextActionDate) : null,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    if (currentData) {
      const oldAction = currentData.nextAction ?? null;
      const oldDate = currentData.nextActionDate?.toDate() ?? null;

      if (
        hasNextActionChanged(
          oldAction,
          oldDate,
          normalizedNextAction,
          nextActionDate
        )
      ) {
        try {
          await activityService.addSystemActivity(
            'next_action_updated',
            'Şirket sonraki adımı güncellendi',
            {
              companyId: id,
              details: buildNextActionUpdateDetails(
                oldAction,
                oldDate,
                normalizedNextAction,
                nextActionDate
              ),
            },
            userId
          );
        } catch (error) {
          console.error(
            'Next action activity log error (company updateNextAction):',
            error
          );
        }
      }
    }
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
