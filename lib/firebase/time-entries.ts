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
  TimeEntry,
  TimeEntryFormData,
  TimeEntryStatus,
  WorkOrder,
  Deliverable,
  Task,
  User,
  TimesheetQueueItem,
} from '@/lib/types';
import { getWeekKey } from '@/lib/utils/status';

const COLLECTION = 'time_entries';

export const timeEntryService = {
  /**
   * Tum zaman girislerini getirir
   */
  getAll: async (options?: {
    userId?: string;
    workOrderId?: string;
    deliverableId?: string;
    taskId?: string;
    weekKey?: string;
    status?: TimeEntryStatus;
    statuses?: TimeEntryStatus[];
    billable?: boolean;
    limitCount?: number;
  }): Promise<TimeEntry[]> => {
    let q = query(
      getCollection<TimeEntry>(COLLECTION),
      orderBy('date', 'desc')
    );

    if (options?.userId) {
      q = query(q, where('userId', '==', options.userId));
    }
    if (options?.workOrderId) {
      q = query(q, where('workOrderId', '==', options.workOrderId));
    }
    if (options?.deliverableId) {
      q = query(q, where('deliverableId', '==', options.deliverableId));
    }
    if (options?.taskId) {
      q = query(q, where('taskId', '==', options.taskId));
    }
    if (options?.weekKey) {
      q = query(q, where('weekKey', '==', options.weekKey));
    }
    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }
    if (options?.statuses && options.statuses.length > 0) {
      q = query(q, where('status', 'in', options.statuses));
    }
    if (options?.billable !== undefined) {
      q = query(q, where('billable', '==', options.billable));
    }
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Kullanicinin zaman girislerini getirir
   */
  getByUserId: async (
    userId: string,
    options?: {
      weekKey?: string;
      status?: TimeEntryStatus;
    }
  ): Promise<TimeEntry[]> => {
    return timeEntryService.getAll({
      userId,
      weekKey: options?.weekKey,
      status: options?.status,
    });
  },

  /**
   * Kullanicinin haftalik zaman girislerini getirir
   */
  getByUserAndWeek: async (
    userId: string,
    weekKey: string
  ): Promise<TimeEntry[]> => {
    const q = query(
      getCollection<TimeEntry>(COLLECTION),
      where('userId', '==', userId),
      where('weekKey', '==', weekKey),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Tek bir zaman girisini getirir
   */
  getById: async (id: string): Promise<TimeEntry | null> => {
    const docRef = doc(getCollection<TimeEntry>(COLLECTION), id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  /**
   * Yeni zaman girisi ekler
   */
  add: async (
    data: TimeEntryFormData,
    userId: string
  ): Promise<string> => {
    // Kullanici bilgisini al
    const userRef = doc(getCollection<User>('users'), userId);
    const userSnap = await getDoc(userRef);
    const userName = userSnap.exists() ? userSnap.data().displayName : null;

    // Work order bilgisini al (varsa)
    let workOrderTitle: string | null = null;
    if (data.workOrderId) {
      const workOrderRef = doc(
        getCollection<WorkOrder>('work_orders'),
        data.workOrderId
      );
      const workOrderSnap = await getDoc(workOrderRef);
      workOrderTitle = workOrderSnap.exists()
        ? workOrderSnap.data().title
        : null;
    }

    // Deliverable bilgisini al (varsa)
    let deliverableTitle: string | null = null;
    if (data.deliverableId) {
      const deliverableRef = doc(
        getCollection<Deliverable>('deliverables'),
        data.deliverableId
      );
      const deliverableSnap = await getDoc(deliverableRef);
      deliverableTitle = deliverableSnap.exists()
        ? deliverableSnap.data().title
        : null;
    }

    // Task bilgisini al (varsa)
    let taskTitle: string | null = null;
    if (data.taskId) {
      const taskRef = doc(getCollection<Task>('tasks'), data.taskId);
      const taskSnap = await getDoc(taskRef);
      taskTitle = taskSnap.exists() ? taskSnap.data().title : null;
    }

    const weekKey = getWeekKey(data.date);
    const now = serverTimestamp() as Timestamp;

    const docRef = await addDoc(getCollection<TimeEntry>(COLLECTION), {
      userId,
      userName,
      workOrderId: data.workOrderId ?? null,
      workOrderTitle,
      deliverableId: data.deliverableId ?? null,
      deliverableTitle,
      taskId: data.taskId ?? null,
      taskTitle,
      date: Timestamp.fromDate(data.date),
      durationMinutes: data.durationMinutes,
      billable: data.billable ?? true,
      note: data.note ?? null,
      weekKey,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    } as TimeEntry);
    return docRef.id;
  },

  /**
   * Zaman girisini gunceller (sadece draft durumda)
   */
  update: async (
    id: string,
    data: Partial<TimeEntryFormData>,
    userId: string
  ): Promise<void> => {
    const existing = await timeEntryService.getById(id);
    if (!existing) {
      throw new Error('Time entry not found');
    }
    if (existing.status !== 'draft') {
      throw new Error('Only draft time entries can be updated');
    }

    const docRef = doc(getCollection<TimeEntry>(COLLECTION), id);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    // Tarih degisti ise weekKey'i de guncelle
    if (data.date) {
      updateData.date = Timestamp.fromDate(data.date);
      updateData.weekKey = getWeekKey(data.date);
    }

    // Work order degisti ise adini da guncelle
    if (data.workOrderId !== undefined) {
      if (data.workOrderId) {
        const workOrderRef = doc(
          getCollection<WorkOrder>('work_orders'),
          data.workOrderId
        );
        const workOrderSnap = await getDoc(workOrderRef);
        updateData.workOrderTitle = workOrderSnap.exists()
          ? workOrderSnap.data().title
          : null;
      } else {
        updateData.workOrderTitle = null;
      }
    }

    // Deliverable degisti ise adini da guncelle
    if (data.deliverableId !== undefined) {
      if (data.deliverableId) {
        const deliverableRef = doc(
          getCollection<Deliverable>('deliverables'),
          data.deliverableId
        );
        const deliverableSnap = await getDoc(deliverableRef);
        updateData.deliverableTitle = deliverableSnap.exists()
          ? deliverableSnap.data().title
          : null;
      } else {
        updateData.deliverableTitle = null;
      }
    }

    // Task degisti ise adini da guncelle
    if (data.taskId !== undefined) {
      if (data.taskId) {
        const taskRef = doc(getCollection<Task>('tasks'), data.taskId);
        const taskSnap = await getDoc(taskRef);
        updateData.taskTitle = taskSnap.exists()
          ? taskSnap.data().title
          : null;
      } else {
        updateData.taskTitle = null;
      }
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Zaman girisini siler (sadece draft durumda)
   */
  delete: async (id: string): Promise<void> => {
    const existing = await timeEntryService.getById(id);
    if (!existing) {
      throw new Error('Time entry not found');
    }
    if (existing.status !== 'draft') {
      throw new Error('Only draft time entries can be deleted');
    }

    const docRef = doc(getCollection<TimeEntry>(COLLECTION), id);
    await deleteDoc(docRef);
  },

  /**
   * Zaman girisini "submitted" yapar
   */
  submit: async (id: string, userId: string): Promise<void> => {
    const docRef = doc(getCollection<TimeEntry>(COLLECTION), id);
    await updateDoc(docRef, {
      status: 'submitted',
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Haftanin tum zaman girislerini "submitted" yapar
   */
  submitWeek: async (
    userId: string,
    weekKey: string,
    submittedBy: string
  ): Promise<void> => {
    const entries = await timeEntryService.getByUserAndWeek(userId, weekKey);
    const draftEntries = entries.filter((e) => e.status === 'draft');

    if (draftEntries.length === 0) return;

    const batch = writeBatch(db);
    draftEntries.forEach((entry) => {
      batch.update(doc(db, COLLECTION, entry.id), {
        status: 'submitted',
        updatedAt: serverTimestamp(),
        updatedBy: submittedBy,
      });
    });
    await batch.commit();
  },

  /**
   * Zaman girisini "approved" yapar
   */
  approve: async (id: string, userId: string): Promise<void> => {
    const docRef = doc(getCollection<TimeEntry>(COLLECTION), id);
    await updateDoc(docRef, {
      status: 'approved',
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Haftanin tum zaman girislerini "approved" yapar
   */
  approveWeek: async (
    userId: string,
    weekKey: string,
    approvedBy: string
  ): Promise<void> => {
    const entries = await timeEntryService.getByUserAndWeek(userId, weekKey);
    const pendingEntries = entries.filter(
      (e) => e.status === 'draft' || e.status === 'submitted'
    );

    if (pendingEntries.length === 0) return;

    const batch = writeBatch(db);
    pendingEntries.forEach((entry) => {
      batch.update(doc(db, COLLECTION, entry.id), {
        status: 'approved',
        updatedAt: serverTimestamp(),
        updatedBy: approvedBy,
      });
    });
    await batch.commit();
  },

  /**
   * Zaman girisini "locked" yapar
   */
  lock: async (id: string, userId: string): Promise<void> => {
    const docRef = doc(getCollection<TimeEntry>(COLLECTION), id);
    await updateDoc(docRef, {
      status: 'locked',
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Haftanin tum zaman girislerini "locked" yapar
   */
  lockWeek: async (
    userId: string,
    weekKey: string,
    lockedBy: string
  ): Promise<void> => {
    const entries = await timeEntryService.getByUserAndWeek(userId, weekKey);
    const approvedEntries = entries.filter((e) => e.status === 'approved');

    if (approvedEntries.length === 0) return;

    const batch = writeBatch(db);
    approvedEntries.forEach((entry) => {
      batch.update(doc(db, COLLECTION, entry.id), {
        status: 'locked',
        updatedAt: serverTimestamp(),
        updatedBy: lockedBy,
      });
    });
    await batch.commit();
  },

  /**
   * Onay bekleyen zaman girislerini getirir (dashboard icin)
   */
  getPendingApproval: async (options?: {
    limitCount?: number;
  }): Promise<TimesheetQueueItem[]> => {
    const q = query(
      getCollection<TimeEntry>(COLLECTION),
      where('status', '==', 'submitted'),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);

    // Kullanici ve hafta bazinda grupla
    const grouped: Record<string, TimesheetQueueItem> = {};
    snapshot.docs.forEach((docSnap) => {
      const entry = docSnap.data();
      const key = `${entry.userId}_${entry.weekKey}`;

      if (!grouped[key]) {
        grouped[key] = {
          userId: entry.userId,
          userName: entry.userName ?? '',
          weekKey: entry.weekKey,
          submittedMinutes: 0,
          entryCount: 0,
        };
      }

      grouped[key].submittedMinutes += entry.durationMinutes;
      grouped[key].entryCount += 1;
    });

    const results = Object.values(grouped).sort((a, b) =>
      b.weekKey.localeCompare(a.weekKey)
    );

    if (options?.limitCount) {
      return results.slice(0, options.limitCount);
    }
    return results;
  },

  /**
   * Kullanicinin haftalik ozet istatistiklerini getirir
   */
  getWeeklySummary: async (
    userId: string,
    weekKey: string
  ): Promise<{
    totalMinutes: number;
    billableMinutes: number;
    byStatus: Record<TimeEntryStatus, number>;
    byWorkOrder: Record<string, number>;
  }> => {
    const entries = await timeEntryService.getByUserAndWeek(userId, weekKey);

    const summary = {
      totalMinutes: 0,
      billableMinutes: 0,
      byStatus: {
        draft: 0,
        submitted: 0,
        approved: 0,
        locked: 0,
      } as Record<TimeEntryStatus, number>,
      byWorkOrder: {} as Record<string, number>,
    };

    entries.forEach((entry) => {
      summary.totalMinutes += entry.durationMinutes;
      if (entry.billable) {
        summary.billableMinutes += entry.durationMinutes;
      }
      summary.byStatus[entry.status] += entry.durationMinutes;

      if (entry.workOrderId) {
        const woKey = entry.workOrderTitle ?? entry.workOrderId;
        summary.byWorkOrder[woKey] =
          (summary.byWorkOrder[woKey] ?? 0) + entry.durationMinutes;
      }
    });

    return summary;
  },

  /**
   * Is emri bazinda toplam zaman hesaplar
   */
  getTotalByWorkOrder: async (
    workOrderId: string
  ): Promise<{ totalMinutes: number; billableMinutes: number }> => {
    const q = query(
      getCollection<TimeEntry>(COLLECTION),
      where('workOrderId', '==', workOrderId)
    );
    const snapshot = await getDocs(q);

    let totalMinutes = 0;
    let billableMinutes = 0;

    snapshot.docs.forEach((docSnap) => {
      const entry = docSnap.data();
      totalMinutes += entry.durationMinutes;
      if (entry.billable) {
        billableMinutes += entry.durationMinutes;
      }
    });

    return { totalMinutes, billableMinutes };
  },
};
