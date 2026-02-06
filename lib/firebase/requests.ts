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
import { activityService } from './activities';
import type {
  Request,
  RequestFormData,
  RequestStatus,
  RequestType,
  RequestPriority,
  Contact,
  Company,
  Deal,
  WorkOrder,
  User,
} from '@/lib/types';

const COLLECTION = 'requests';

export const requestService = {
  /**
   * Tum talepleri getirir
   */
  getAll: async (options?: {
    status?: RequestStatus;
    statuses?: RequestStatus[];
    type?: RequestType;
    priority?: RequestPriority;
    assigneeId?: string;
    requesterId?: string;
    companyId?: string;
    isArchived?: boolean;
    limitCount?: number;
  }): Promise<Request[]> => {
    let q = query(
      getCollection<Request>(COLLECTION),
      orderBy('createdAt', 'desc')
    );

    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }
    if (options?.statuses && options.statuses.length > 0) {
      q = query(q, where('status', 'in', options.statuses));
    }
    if (options?.type) {
      q = query(q, where('type', '==', options.type));
    }
    if (options?.priority) {
      q = query(q, where('priority', '==', options.priority));
    }
    if (options?.assigneeId) {
      q = query(q, where('assigneeId', '==', options.assigneeId));
    }
    if (options?.requesterId) {
      q = query(q, where('requesterId', '==', options.requesterId));
    }
    if (options?.companyId) {
      q = query(q, where('companyId', '==', options.companyId));
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
   * Tek bir talebi getirir
   */
  getById: async (id: string): Promise<Request | null> => {
    const docRef = doc(getCollection<Request>(COLLECTION), id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  },

  /**
   * Yeni talep olusturur
   */
  add: async (data: RequestFormData, userId: string): Promise<string> => {
    // Denormalize alanlar
    let requesterName = '';
    let assigneeName: string | null = null;
    let contactName: string | null = null;
    let companyName: string | null = null;
    let dealTitle: string | null = null;
    let workOrderTitle: string | null = null;

    // Requester bilgisi
    const userRef = doc(getCollection<User>('users'), userId);
    const userSnap = await getDoc(userRef);
    requesterName = userSnap.exists() ? (userSnap.data().displayName ?? 'Bilinmeyen') : 'Bilinmeyen';

    // Assignee bilgisi
    if (data.assigneeId) {
      const assigneeRef = doc(getCollection<User>('users'), data.assigneeId);
      const assigneeSnap = await getDoc(assigneeRef);
      assigneeName = assigneeSnap.exists() ? (assigneeSnap.data().displayName ?? null) : null;
    }

    // Baglam denormalizasyonu
    if (data.contactId) {
      const contactRef = doc(getCollection<Contact>('contacts'), data.contactId);
      const contactSnap = await getDoc(contactRef);
      if (contactSnap.exists()) {
        contactName = contactSnap.data().fullName;
        if (!data.companyId && contactSnap.data().companyId) {
          data.companyId = contactSnap.data().companyId;
          companyName = contactSnap.data().companyName;
        }
      }
    }

    if (data.companyId && !companyName) {
      const companyRef = doc(getCollection<Company>('companies'), data.companyId);
      const companySnap = await getDoc(companyRef);
      companyName = companySnap.exists() ? companySnap.data().name : null;
    }

    if (data.dealId) {
      const dealRef = doc(getCollection<Deal>('deals'), data.dealId);
      const dealSnap = await getDoc(dealRef);
      dealTitle = dealSnap.exists() ? dealSnap.data().title : null;
    }

    if (data.workOrderId) {
      const woRef = doc(getCollection<WorkOrder>('work_orders'), data.workOrderId);
      const woSnap = await getDoc(woRef);
      workOrderTitle = woSnap.exists() ? woSnap.data().title : null;
    }

    const now = serverTimestamp() as Timestamp;
    const docRef = await addDoc(getCollection<Request>(COLLECTION), {
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      priority: data.priority ?? 'normal',
      status: 'open' as RequestStatus,
      requesterId: userId,
      requesterName,
      assigneeId: data.assigneeId ?? null,
      assigneeName,
      contactId: data.contactId ?? null,
      contactName,
      companyId: data.companyId ?? null,
      companyName,
      dealId: data.dealId ?? null,
      dealTitle,
      workOrderId: data.workOrderId ?? null,
      workOrderTitle,
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
      resolution: null,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
      isArchived: false,
    } as Request);

    // System activity olustur
    await activityService.addSystemActivity(
      'request_created',
      `Yeni talep: ${data.title}`,
      {
        requestId: docRef.id,
        contactId: data.contactId ?? undefined,
        companyId: data.companyId ?? undefined,
        dealId: data.dealId ?? undefined,
        workOrderId: data.workOrderId ?? undefined,
      },
      userId
    );

    return docRef.id;
  },

  /**
   * Talep gunceller
   */
  update: async (
    id: string,
    data: Partial<RequestFormData> & { resolution?: string },
    userId: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Request>(COLLECTION), id);
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    // Assignee degistiyse ad guncelle
    if (data.assigneeId !== undefined) {
      if (data.assigneeId) {
        const assigneeRef = doc(getCollection<User>('users'), data.assigneeId);
        const assigneeSnap = await getDoc(assigneeRef);
        updateData.assigneeName = assigneeSnap.exists()
          ? (assigneeSnap.data().displayName ?? null)
          : null;
      } else {
        updateData.assigneeName = null;
      }
    }

    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate
        ? Timestamp.fromDate(data.dueDate)
        : null;
    }

    await updateDoc(docRef, updateData);
  },

  /**
   * Talep durumunu gunceller
   */
  updateStatus: async (
    id: string,
    status: RequestStatus,
    userId: string,
    resolution?: string
  ): Promise<void> => {
    const docRef = doc(getCollection<Request>(COLLECTION), id);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };

    if (resolution !== undefined) {
      updateData.resolution = resolution;
    }

    await updateDoc(docRef, updateData);

    // done veya cancelled oldigunda system activity
    if (status === 'done') {
      const request = await requestService.getById(id);
      if (request) {
        await activityService.addSystemActivity(
          'request_completed',
          `Talep tamamlandı: ${request.title}`,
          {
            requestId: id,
            contactId: request.contactId ?? undefined,
            companyId: request.companyId ?? undefined,
            dealId: request.dealId ?? undefined,
            workOrderId: request.workOrderId ?? undefined,
          },
          userId
        );
      }
    }
  },

  /**
   * Talebi siler
   */
  delete: async (id: string): Promise<void> => {
    const docRef = doc(getCollection<Request>(COLLECTION), id);
    await deleteDoc(docRef);
  },

  /**
   * Acik talepleri getirir (status: open veya in-progress)
   */
  getOpen: async (options?: {
    limitCount?: number;
  }): Promise<Request[]> => {
    return requestService.getAll({
      statuses: ['open', 'in-progress'],
      limitCount: options?.limitCount,
    });
  },

  /**
   * Atanan kisinin taleplerini getirir
   */
  getByAssignee: async (
    assigneeId: string,
    options?: { limitCount?: number }
  ): Promise<Request[]> => {
    return requestService.getAll({
      assigneeId,
      statuses: ['open', 'in-progress'],
      limitCount: options?.limitCount,
    });
  },
};
