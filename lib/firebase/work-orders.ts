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
  WorkOrder,
  WorkOrderFormData,
  WorkOrderStatus,
  PaymentStatus,
  Company,
  Deal,
  Proposal,
  WorkOrderRiskItem,
  Deliverable,
} from '@/lib/types';

const COLLECTION = 'work_orders';

export const workOrderService = {
  /**
   * Tum is emirlerini getirir
   */
  getAll: async (options?: {
    companyId?: string;
    dealId?: string;
    status?: WorkOrderStatus;
    statuses?: WorkOrderStatus[];
    ownerId?: string;
    isArchived?: boolean;
    limitCount?: number;
  }): Promise<WorkOrder[]> => {
    let q = query(
      getCollection<WorkOrder>(COLLECTION),
      orderBy('targetDeliveryDate', 'asc')
    );

    if (options?.companyId) {
      q = query(q, where('companyId', '==', options.companyId));
    }
    if (options?.dealId) {
      q = query(q, where('dealId', '==', options.dealId));
    }
    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }
    if (options?.statuses && options.statuses.length > 0) {
      q = query(q, where('status', 'in', options.statuses));
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
   * Aktif is emirlerini getirir
   */
  getActive: async (options?: {
    ownerId?: string;
    limitCount?: number;
  }): Promise<WorkOrder[]> => {
    return workOrderService.getAll({
      ...options,
      statuses: ['active', 'on-hold'],
      isArchived: false,
    });
  },

  /**
   * Tek bir is emrini getirir
   */
  getById: async (id: string): Promise<WorkOrder | null> => {
    const docRef = doc(getCollection<WorkOrder>(COLLECTION), id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  /**
   * Yeni is emri ekler
   */
  add: async (data: WorkOrderFormData, userId: string): Promise<string> => {
    // Company bilgisini al
    const companyRef = doc(getCollection<Company>('companies'), data.companyId);
    const companySnap = await getDoc(companyRef);
    const companyName = companySnap.exists() ? companySnap.data().name : '';

    // Deal bilgisini al (varsa)
    let dealTitle: string | null = null;
    if (data.dealId) {
      const dealRef = doc(getCollection<Deal>('deals'), data.dealId);
      const dealSnap = await getDoc(dealRef);
      dealTitle = dealSnap.exists() ? dealSnap.data().title : null;
    }

    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection<WorkOrder>(COLLECTION), {
      companyId: data.companyId,
      companyName,
      dealId: data.dealId ?? null,
      dealTitle,
      proposalId: data.proposalId ?? null,
      title: data.title,
      status: data.status ?? 'active',
      startDate: data.startDate ? Timestamp.fromDate(data.startDate) : now,
      targetDeliveryDate: Timestamp.fromDate(data.targetDeliveryDate),
      scopeSummary: data.scopeSummary ?? null,
      paymentStatus: data.paymentStatus ?? 'unplanned',
      ownerId: data.ownerId ?? userId,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      isArchived: false,
    } as WorkOrder);
    return docRef.id;
  },

  /**
   * Deal kazanildiginda is emri olusturur
   */
  createFromDeal: async (
    dealId: string,
    targetDeliveryDate: Date,
    userId: string
  ): Promise<string> => {
    const dealRef = doc(getCollection<Deal>('deals'), dealId);
    const dealSnap = await getDoc(dealRef);
    if (!dealSnap.exists()) {
      throw new Error('Deal not found');
    }
    const deal = dealSnap.data();

    // Kabul edilmis teklifi bul
    const proposalsQuery = query(
      getCollection<Proposal>('proposals'),
      where('dealId', '==', dealId),
      where('status', '==', 'accepted'),
      orderBy('version', 'desc'),
      limit(1)
    );
    const proposalsSnap = await getDocs(proposalsQuery);
    const proposalId =
      proposalsSnap.docs.length > 0 ? proposalsSnap.docs[0].id : null;

    return workOrderService.add(
      {
        companyId: deal.companyId,
        dealId,
        proposalId,
        title: deal.title,
        targetDeliveryDate,
        ownerId: deal.ownerId ?? undefined,
      },
      userId
    );
  },

  /**
   * Is emrini gunceller
   */
  update: async (
    id: string,
    data: Partial<WorkOrderFormData>,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<WorkOrder>(COLLECTION), id);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    // Tarih alanlarini Timestamp'e cevir
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate
        ? Timestamp.fromDate(data.startDate)
        : null;
    }
    if (data.targetDeliveryDate !== undefined) {
      updateData.targetDeliveryDate = Timestamp.fromDate(data.targetDeliveryDate);
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Is emri durumunu gunceller
   */
  updateStatus: async (
    id: string,
    status: WorkOrderStatus,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<WorkOrder>(COLLECTION), id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Odeme durumunu gunceller
   */
  updatePaymentStatus: async (
    id: string,
    paymentStatus: PaymentStatus,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<WorkOrder>(COLLECTION), id);
    await updateDoc(docRef, {
      paymentStatus,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * lastActivityAt gunceller
   */
  updateLastActivity: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<WorkOrder>(COLLECTION), id);
    await updateDoc(docRef, {
      lastActivityAt: serverTimestamp(),
    });
  },

  /**
   * Is emrini arsivler
   */
  archive: async (id: string, userId: string): Promise<void> => {
    const docRef = doc(getCollection<WorkOrder>(COLLECTION), id);
    await updateDoc(docRef, {
      isArchived: true,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Is emrini siler
   */
  delete: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<WorkOrder>(COLLECTION), id);
    await deleteDoc(docRef);
  },

  /**
   * Is emri basligini ve iliskili dokumanlardaki denormalize alanlari gunceller
   */
  updateTitle: async (
    id: string,
    newTitle: string,
    userId: string
  ): Promise<void> => {
    const batch = writeBatch(db);
    const workOrderRef = doc(db, COLLECTION, id);

    // Is emrini guncelle
    batch.update(workOrderRef, {
      title: newTitle,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // Deliverables
    const deliverablesQuery = query(
      getCollection<{ workOrderId: string }>('deliverables'),
      where('workOrderId', '==', id)
    );
    const deliverablesSnapshot = await getDocs(deliverablesQuery);
    deliverablesSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'deliverables', docSnap.id), {
        workOrderTitle: newTitle,
      });
    });

    // Tasks
    const tasksQuery = query(
      getCollection<{ workOrderId: string }>('tasks'),
      where('workOrderId', '==', id)
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'tasks', docSnap.id), { workOrderTitle: newTitle });
    });

    // TimeEntries
    const timeEntriesQuery = query(
      getCollection<{ workOrderId: string }>('time_entries'),
      where('workOrderId', '==', id)
    );
    const timeEntriesSnapshot = await getDocs(timeEntriesQuery);
    timeEntriesSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'time_entries', docSnap.id), {
        workOrderTitle: newTitle,
      });
    });

    // Activities
    const activitiesQuery = query(
      getCollection<{ workOrderId: string }>('activities'),
      where('workOrderId', '==', id)
    );
    const activitiesSnapshot = await getDocs(activitiesQuery);
    activitiesSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'activities', docSnap.id), {
        workOrderTitle: newTitle,
      });
    });

    await batch.commit();
  },

  /**
   * Riskli is emirlerini getirir (dashboard icin)
   */
  getRiskyWorkOrders: async (options?: {
    ownerId?: string;
    limitCount?: number;
  }): Promise<WorkOrderRiskItem[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    // Aktif is emirlerini al
    const workOrders = await workOrderService.getActive({
      ownerId: options?.ownerId,
    });

    // Her is emri icin blocked deliverable sayisini hesapla
    const results: WorkOrderRiskItem[] = [];
    for (const wo of workOrders) {
      const deliverablesQuery = query(
        getCollection<Deliverable>('deliverables'),
        where('workOrderId', '==', wo.id),
        where('status', '==', 'blocked')
      );
      const deliverablesSnap = await getDocs(deliverablesQuery);
      const blockedDeliverables = deliverablesSnap.docs.length;

      const targetDate = wo.targetDeliveryDate.toDate();
      const isOverdue = targetDate < today;
      const isDueSoon = !isOverdue && targetDate <= sevenDaysLater;

      // Riskli olanları filtrele
      if (isOverdue || isDueSoon || blockedDeliverables > 0 || wo.paymentStatus === 'deposit-requested') {
        results.push({
          workOrderId: wo.id,
          title: wo.title,
          companyName: wo.companyName,
          targetDeliveryDate: wo.targetDeliveryDate,
          status: wo.status,
          blockedDeliverables,
          paymentStatus: wo.paymentStatus,
          isOverdue,
          isDueSoon,
        });
      }
    }

    // Sirala: once overdue, sonra due soon
    results.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return a.targetDeliveryDate.toMillis() - b.targetDeliveryDate.toMillis();
    });

    if (options?.limitCount) {
      return results.slice(0, options.limitCount);
    }
    return results;
  },
};
