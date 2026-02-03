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
import type {
  Deal,
  DealFormData,
  DealStage,
  LostReason,
  Company,
  Contact,
  PipelineStageSummary,
} from '@/lib/types';
import { DEAL_STAGES } from '@/lib/types';

const COLLECTION = 'deals';

export const dealService = {
  /**
   * Tum deal'leri getirir
   */
  getAll: async (options?: {
    companyId?: string;
    stage?: DealStage;
    stages?: DealStage[];
    ownerId?: string;
    isArchived?: boolean;
    limitCount?: number;
  }): Promise<Deal[]> => {
    let q = query(
      getCollection<Deal>(COLLECTION),
      orderBy('lastActivityAt', 'desc')
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
   * Pipeline'daki aktif deal'leri getirir (won ve lost haric)
   */
  getActivePipeline: async (options?: {
    ownerId?: string;
    limitCount?: number;
  }): Promise<Deal[]> => {
    const activeStages: DealStage[] = [
      'lead',
      'qualified',
      'proposal-prep',
      'proposal-sent',
      'negotiation',
    ];

    let q = query(
      getCollection<Deal>(COLLECTION),
      where('isArchived', '==', false),
      where('stage', 'in', activeStages),
      orderBy('lastActivityAt', 'desc')
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
   * Tek bir deal'i getirir
   */
  getById: async (id: string): Promise<Deal | null> => {
    const docRef = doc(getCollection<Deal>(COLLECTION), id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  /**
   * Yeni deal ekler
   */
  add: async (data: DealFormData, userId: string): Promise<string> => {
    // Şirket ve contact adlarini al (denormalizasyon icin)
    const companyRef = doc(getCollection<Company>('companies'), data.companyId);
    const companySnap = await getDoc(companyRef);
    const companyName = companySnap.exists() ? companySnap.data().name : '';

    const contactRef = doc(getCollection<Contact>('contacts'), data.primaryContactId);
    const contactSnap = await getDoc(contactRef);
    const primaryContactName = contactSnap.exists()
      ? contactSnap.data().fullName
      : '';

    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection<Deal>(COLLECTION), {
      companyId: data.companyId,
      companyName,
      primaryContactId: data.primaryContactId,
      primaryContactName,
      title: data.title,
      stage: data.stage ?? 'lead',
      lostReason: null,
      expectedCloseDate: data.expectedCloseDate
        ? Timestamp.fromDate(data.expectedCloseDate)
        : null,
      estimatedBudgetMinor: data.estimatedBudgetMinor ?? null,
      currency: data.currency ?? 'TRY',
      ownerId: data.ownerId ?? userId,
      nextAction: data.nextAction ?? null,
      nextActionDate: data.nextActionDate
        ? Timestamp.fromDate(data.nextActionDate)
        : null,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      isArchived: false,
    } as Deal);
    return docRef.id;
  },

  /**
   * Deal günceller
   */
  update: async (
    id: string,
    data: Partial<DealFormData>,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Deal>(COLLECTION), id);
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
    if (data.expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = data.expectedCloseDate
        ? Timestamp.fromDate(data.expectedCloseDate)
        : null;
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Deal'i arsivler (soft delete)
   */
  archive: async (id: string, userId: string): Promise<void> => {
    const docRef = doc(getCollection<Deal>(COLLECTION), id);
    await updateDoc(docRef, {
      isArchived: true,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Deal'i kalici olarak siler
   */
  delete: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<Deal>(COLLECTION), id);
    await deleteDoc(docRef);
  },

  /**
   * Deal stage degistirir
   */
  updateStage: async (
    id: string,
    stage: DealStage,
    userId: string,
    lostReason?: LostReason
  ): Promise<void> => {
    const docRef = doc(getCollection<Deal>(COLLECTION), id);
    const updateData: Record<string, unknown> = {
      stage,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (stage === 'lost' && lostReason) {
      updateData.lostReason = lostReason;
    } else if (stage !== 'lost') {
      updateData.lostReason = null;
    }

    await updateDoc(docRef, updateData);
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
    const docRef = doc(getCollection<Deal>(COLLECTION), id);
    await updateDoc(docRef, {
      nextAction,
      nextActionDate: nextActionDate ? Timestamp.fromDate(nextActionDate) : null,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * lastActivityAt günceller
   */
  updateLastActivity: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<Deal>(COLLECTION), id);
    await updateDoc(docRef, {
      lastActivityAt: serverTimestamp(),
    });
  },

  /**
   * Deal basligini ve iliskili dokumanlardaki denormalize alanlari günceller
   */
  updateTitle: async (
    id: string,
    newTitle: string,
    userId: string
  ): Promise<void> => {
    const batch = writeBatch(db);
    const dealRef = doc(db, COLLECTION, id);

    // Deal'i güncelle
    batch.update(dealRef, {
      title: newTitle,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // Proposals
    const proposalsQuery = query(
      getCollection<{ dealId: string }>('proposals'),
      where('dealId', '==', id)
    );
    const proposalsSnapshot = await getDocs(proposalsQuery);
    proposalsSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'proposals', docSnap.id), { dealTitle: newTitle });
    });

    // WorkOrders
    const workOrdersQuery = query(
      getCollection<{ dealId: string }>('work_orders'),
      where('dealId', '==', id)
    );
    const workOrdersSnapshot = await getDocs(workOrdersQuery);
    workOrdersSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'work_orders', docSnap.id), { dealTitle: newTitle });
    });

    // Activities
    const activitiesQuery = query(
      getCollection<{ dealId: string }>('activities'),
      where('dealId', '==', id)
    );
    const activitiesSnapshot = await getDocs(activitiesQuery);
    activitiesSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'activities', docSnap.id), { dealTitle: newTitle });
    });

    await batch.commit();
  },

  /**
   * Geciken takipleri getirir
   */
  getOverdueFollowUps: async (options?: {
    ownerId?: string;
    limitCount?: number;
  }): Promise<Deal[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeStages: DealStage[] = [
      'lead',
      'qualified',
      'proposal-prep',
      'proposal-sent',
      'negotiation',
    ];

    let q = query(
      getCollection<Deal>(COLLECTION),
      where('isArchived', '==', false),
      where('stage', 'in', activeStages),
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
   * Bugunun takiplerini getirir
   */
  getTodayFollowUps: async (options?: {
    ownerId?: string;
    limitCount?: number;
  }): Promise<Deal[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeStages: DealStage[] = [
      'lead',
      'qualified',
      'proposal-prep',
      'proposal-sent',
      'negotiation',
    ];

    let q = query(
      getCollection<Deal>(COLLECTION),
      where('isArchived', '==', false),
      where('stage', 'in', activeStages),
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
   * Pipeline ozet istatistiklerini hesaplar
   */
  getPipelineSummary: async (): Promise<PipelineStageSummary[]> => {
    try {
      const q = query(
        getCollection<Deal>(COLLECTION),
        where('isArchived', '==', false)
      );
      const snapshot = await getDocs(q);

      const summaryMap: Record<DealStage, PipelineStageSummary> = {} as Record<
        DealStage,
        PipelineStageSummary
      >;

      // Initialize all stages
      DEAL_STAGES.forEach((stage) => {
        summaryMap[stage] = {
          stage,
          count: 0,
          sumEstimatedBudgetMinor: 0,
        };
      });

      // Aggregate
      snapshot.docs.forEach((docSnap) => {
        const deal = docSnap.data();
        
        // Koruma: stage undefined veya geçersiz olabilir
        if (!deal.stage) {
          console.warn('Deal stage undefined:', deal.id, deal);
          return;
        }
        
        if (!summaryMap[deal.stage]) {
          console.warn('Geçersiz deal stage:', deal.stage, 'Deal ID:', deal.id);
          return;
        }
        
        summaryMap[deal.stage].count += 1;
        summaryMap[deal.stage].sumEstimatedBudgetMinor +=
          deal.estimatedBudgetMinor ?? 0;
      });

      return DEAL_STAGES.map((stage) => summaryMap[stage]);
    } catch (error) {
      console.error('getPipelineSummary hatası:', error);
      throw error;
    }
  },

  /**
   * Uzun suredir aktivite olmayan proposal-sent deal'leri getirir (smart nudge)
   */
  getStaleProposals: async (daysWithoutActivity: number = 7): Promise<Deal[]> => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysWithoutActivity);

    const q = query(
      getCollection<Deal>(COLLECTION),
      where('isArchived', '==', false),
      where('stage', '==', 'proposal-sent'),
      where('lastActivityAt', '<=', Timestamp.fromDate(cutoffDate)),
      orderBy('lastActivityAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },
};
