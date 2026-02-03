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
  Deliverable,
  DeliverableFormData,
  DeliverableStatus,
  WorkOrder,
} from '@/lib/types';

const COLLECTION = 'deliverables';

export const deliverableService = {
  /**
   * Tum teslimatlari getirir
   */
  getAll: async (options?: {
    workOrderId?: string;
    status?: DeliverableStatus;
    limitCount?: number;
  }): Promise<Deliverable[]> => {
    let q = query(
      getCollection<Deliverable>(COLLECTION),
      orderBy('createdAt', 'asc')
    );

    if (options?.workOrderId) {
      q = query(q, where('workOrderId', '==', options.workOrderId));
    }
    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * İş Emrinin teslimatlarini getirir
   */
  getByWorkOrderId: async (workOrderId: string): Promise<Deliverable[]> => {
    const q = query(
      getCollection<Deliverable>(COLLECTION),
      where('workOrderId', '==', workOrderId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Tek bir teslimati getirir
   */
  getById: async (id: string): Promise<Deliverable | null> => {
    const docRef = doc(getCollection<Deliverable>(COLLECTION), id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  /**
   * Yeni teslimat ekler
   */
  add: async (data: DeliverableFormData, userId: string): Promise<string> => {
    // Work order bilgisini al
    const workOrderRef = doc(getCollection<WorkOrder>('work_orders'), data.workOrderId);
    const workOrderSnap = await getDoc(workOrderRef);
    const workOrderTitle = workOrderSnap.exists()
      ? workOrderSnap.data().title
      : '';

    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection<Deliverable>(COLLECTION), {
      workOrderId: data.workOrderId,
      workOrderTitle,
      title: data.title,
      status: data.status ?? 'not-started',
      targetDate: data.targetDate ? Timestamp.fromDate(data.targetDate) : null,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    } as Deliverable);
    return docRef.id;
  },

  /**
   * Birden fazla teslimat ekler (İş Emri olusturulurken)
   */
  addMultiple: async (
    workOrderId: string,
    titles: string[],
    userId: string
  ): Promise<string[]> => {
    const workOrderRef = doc(getCollection<WorkOrder>('work_orders'), workOrderId);
    const workOrderSnap = await getDoc(workOrderRef);
    const workOrderTitle = workOrderSnap.exists()
      ? workOrderSnap.data().title
      : '';

    const batch = writeBatch(db);
    const ids: string[] = [];
    const now = Timestamp.now();

    for (const title of titles) {
      const docRef = doc(getCollection<Deliverable>(COLLECTION));
      ids.push(docRef.id);

      batch.set(docRef, {
        id: docRef.id,
        workOrderId,
        workOrderTitle,
        title,
        status: 'not-started',
        targetDate: null,
        notes: null,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      } as Deliverable);
    }

    await batch.commit();
    return ids;
  },

  /**
   * Teslimati günceller
   */
  update: async (
    id: string,
    data: Partial<DeliverableFormData>,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Deliverable>(COLLECTION), id);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    // Tarih alanini Timestamp'e cevir
    if (data.targetDate !== undefined) {
      updateData.targetDate = data.targetDate
        ? Timestamp.fromDate(data.targetDate)
        : null;
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Teslimat durumunu günceller
   */
  updateStatus: async (
    id: string,
    status: DeliverableStatus,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Deliverable>(COLLECTION), id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Teslimati siler
   */
  delete: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<Deliverable>(COLLECTION), id);
    await deleteDoc(docRef);
  },

  /**
   * Teslimat basligini ve iliskili dokumanlardaki denormalize alanlari günceller
   */
  updateTitle: async (
    id: string,
    newTitle: string,
    userId: string
  ): Promise<void> => {
    const batch = writeBatch(db);
    const deliverableRef = doc(db, COLLECTION, id);

    // Teslimati güncelle
    batch.update(deliverableRef, {
      title: newTitle,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // Tasks
    const tasksQuery = query(
      getCollection<{ deliverableId: string }>('tasks'),
      where('deliverableId', '==', id)
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'tasks', docSnap.id), {
        deliverableTitle: newTitle,
      });
    });

    // TimeEntries
    const timeEntriesQuery = query(
      getCollection<{ deliverableId: string }>('time_entries'),
      where('deliverableId', '==', id)
    );
    const timeEntriesSnapshot = await getDocs(timeEntriesQuery);
    timeEntriesSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'time_entries', docSnap.id), {
        deliverableTitle: newTitle,
      });
    });

    await batch.commit();
  },

  /**
   * İş Emrinin blocked teslimat sayisini getirir
   */
  getBlockedCount: async (workOrderId: string): Promise<number> => {
    const q = query(
      getCollection<Deliverable>(COLLECTION),
      where('workOrderId', '==', workOrderId),
      where('status', '==', 'blocked')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length;
  },

  /**
   * İş Emrinin teslimat istatistiklerini getirir
   */
  getStatsByWorkOrder: async (
    workOrderId: string
  ): Promise<{ total: number; byStatus: Record<DeliverableStatus, number> }> => {
    const deliverables = await deliverableService.getByWorkOrderId(workOrderId);

    const byStatus: Record<DeliverableStatus, number> = {
      'not-started': 0,
      'in-progress': 0,
      blocked: 0,
      delivered: 0,
      approved: 0,
    };

    deliverables.forEach((d) => {
      byStatus[d.status] += 1;
    });

    return {
      total: deliverables.length,
      byStatus,
    };
  },
};
