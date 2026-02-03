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
  Task,
  TaskFormData,
  TaskStatus,
  BlockedReason,
  WorkOrder,
  Deliverable,
  User,
} from '@/lib/types';

const COLLECTION = 'tasks';

export const taskService = {
  /**
   * Tum gorevleri getirir
   */
  getAll: async (options?: {
    workOrderId?: string;
    deliverableId?: string;
    status?: TaskStatus;
    statuses?: TaskStatus[];
    assigneeId?: string;
    limitCount?: number;
  }): Promise<Task[]> => {
    let q = query(
      getCollection<Task>(COLLECTION),
      orderBy('createdAt', 'asc')
    );

    if (options?.workOrderId) {
      q = query(q, where('workOrderId', '==', options.workOrderId));
    }
    if (options?.deliverableId) {
      q = query(q, where('deliverableId', '==', options.deliverableId));
    }
    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }
    if (options?.statuses && options.statuses.length > 0) {
      q = query(q, where('status', 'in', options.statuses));
    }
    if (options?.assigneeId) {
      q = query(q, where('assigneeId', '==', options.assigneeId));
    }
    if (options?.limitCount) {
      q = query(q, limit(options.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * İş Emrinin gorevlerini getirir
   */
  getByWorkOrderId: async (workOrderId: string): Promise<Task[]> => {
    const q = query(
      getCollection<Task>(COLLECTION),
      where('workOrderId', '==', workOrderId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Teslimatin gorevlerini getirir
   */
  getByDeliverableId: async (deliverableId: string): Promise<Task[]> => {
    const q = query(
      getCollection<Task>(COLLECTION),
      where('deliverableId', '==', deliverableId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * Tek bir gorevi getirir
   */
  getById: async (id: string): Promise<Task | null> => {
    const docRef = doc(getCollection<Task>(COLLECTION), id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  /**
   * Yeni gorev ekler
   */
  add: async (data: TaskFormData, userId: string): Promise<string> => {
    // Work order bilgisini al
    const workOrderRef = doc(getCollection<WorkOrder>('work_orders'), data.workOrderId);
    const workOrderSnap = await getDoc(workOrderRef);
    const workOrderTitle = workOrderSnap.exists()
      ? workOrderSnap.data().title
      : '';

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

    // Assignee bilgisini al (varsa)
    let assigneeName: string | null = null;
    if (data.assigneeId) {
      const userRef = doc(getCollection<User>('users'), data.assigneeId);
      const userSnap = await getDoc(userRef);
      assigneeName = userSnap.exists()
        ? userSnap.data().displayName
        : null;
    }

    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection<Task>(COLLECTION), {
      workOrderId: data.workOrderId,
      workOrderTitle,
      deliverableId: data.deliverableId ?? null,
      deliverableTitle,
      title: data.title,
      status: data.status ?? 'backlog',
      blockedReason: data.blockedReason ?? null,
      assigneeId: data.assigneeId ?? null,
      assigneeName,
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    } as Task);
    return docRef.id;
  },

  /**
   * Gorevi günceller
   */
  update: async (
    id: string,
    data: Partial<TaskFormData>,
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Task>(COLLECTION), id);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    // Tarih alanini Timestamp'e cevir
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate
        ? Timestamp.fromDate(data.dueDate)
        : null;
    }

    // Assignee degisti ise adini da güncelle
    if (data.assigneeId !== undefined) {
      if (data.assigneeId) {
        const userRef = doc(getCollection<User>('users'), data.assigneeId);
        const userSnap = await getDoc(userRef);
        updateData.assigneeName = userSnap.exists()
          ? userSnap.data().displayName
          : null;
      } else {
        updateData.assigneeName = null;
      }
    }

    // Deliverable degisti ise adini da güncelle
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

    await updateDoc(docRef, updateData);
  },

  /**
   * Gorev durumunu günceller
   */
  updateStatus: async (
    id: string,
    status: TaskStatus,
    userId: string,
    blockedReason?: BlockedReason
  ): Promise<void> => {
    const docRef = doc(getCollection<Task>(COLLECTION), id);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (status === 'blocked' && blockedReason) {
      updateData.blockedReason = blockedReason;
    } else if (status !== 'blocked') {
      updateData.blockedReason = null;
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Gorev atanmasini günceller
   */
  updateAssignee: async (
    id: string,
    assigneeId: string | null,
    userId: string
  ): Promise<void> => {
    let assigneeName: string | null = null;
    if (assigneeId) {
      const userRef = doc(getCollection<User>('users'), assigneeId);
      const userSnap = await getDoc(userRef);
      assigneeName = userSnap.exists() ? userSnap.data().displayName : null;
    }

    const docRef = doc(getCollection<Task>(COLLECTION), id);
    await updateDoc(docRef, {
      assigneeId,
      assigneeName,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  /**
   * Gorevi siler
   */
  delete: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<Task>(COLLECTION), id);
    await deleteDoc(docRef);
  },

  /**
   * Gorev basligini ve iliskili dokumanlardaki denormalize alanlari günceller
   */
  updateTitle: async (
    id: string,
    newTitle: string,
    userId: string
  ): Promise<void> => {
    const batch = writeBatch(db);
    const taskRef = doc(db, COLLECTION, id);

    // Gorevi güncelle
    batch.update(taskRef, {
      title: newTitle,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // TimeEntries
    const timeEntriesQuery = query(
      getCollection<{ taskId: string }>('time_entries'),
      where('taskId', '==', id)
    );
    const timeEntriesSnapshot = await getDocs(timeEntriesQuery);
    timeEntriesSnapshot.docs.forEach((docSnap) => {
      batch.update(doc(db, 'time_entries', docSnap.id), { taskTitle: newTitle });
    });

    await batch.commit();
  },

  /**
   * Kanban icin gorevleri status gruplu getirir
   */
  getGroupedByStatus: async (
    workOrderId: string
  ): Promise<Record<TaskStatus, Task[]>> => {
    const tasks = await taskService.getByWorkOrderId(workOrderId);

    const grouped: Record<TaskStatus, Task[]> = {
      backlog: [],
      'in-progress': [],
      blocked: [],
      done: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  },

  /**
   * Uzun suredir blocked olan gorevleri getirir (smart nudge)
   */
  getStaleBlockedTasks: async (daysBlocked: number = 3): Promise<Task[]> => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBlocked);

    const q = query(
      getCollection<Task>(COLLECTION),
      where('status', '==', 'blocked'),
      where('updatedAt', '<=', Timestamp.fromDate(cutoffDate)),
      orderBy('updatedAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  /**
   * İş Emrinin gorev istatistiklerini getirir
   */
  getStatsByWorkOrder: async (
    workOrderId: string
  ): Promise<{ total: number; byStatus: Record<TaskStatus, number> }> => {
    const tasks = await taskService.getByWorkOrderId(workOrderId);

    const byStatus: Record<TaskStatus, number> = {
      backlog: 0,
      'in-progress': 0,
      blocked: 0,
      done: 0,
    };

    tasks.forEach((t) => {
      byStatus[t.status] += 1;
    });

    return {
      total: tasks.length,
      byStatus,
    };
  },
};
