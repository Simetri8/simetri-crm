import {
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { getCollection } from './firestore';
import { Communication } from '@/lib/types';
import { customerService } from './customers';

const COMMUNICATIONS_COLLECTION = 'communications';

export const communicationService = {
  // Get all communications
  getAll: async (limitCount: number = 50) => {
    const q = query(
      getCollection<Communication>(COMMUNICATIONS_COLLECTION),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  // Get communications by customer
  getByCustomer: async (customerId: string) => {
    const q = query(
      getCollection<Communication>(COMMUNICATIONS_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  // Get recent communications (for dashboard)
  getRecent: async (limitCount: number = 10) => {
    const q = query(
      getCollection<Communication>(COMMUNICATIONS_COLLECTION),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  // Add new communication
  add: async (communication: Omit<Communication, 'id' | 'createdAt'>) => {
    const now = serverTimestamp();
    const result = await addDoc(getCollection<Communication>(COMMUNICATIONS_COLLECTION), {
      ...communication,
      createdAt: now as Timestamp,
    });

    // Update customer's lastContactDate
    if (communication.customerId) {
      await customerService.update(communication.customerId, {
        lastContactDate: communication.date,
      });
    }

    return result;
  },

  // Update communication
  update: async (id: string, data: Partial<Communication>) => {
    const docRef = doc(db, COMMUNICATIONS_COLLECTION, id);
    return updateDoc(docRef, data);
  },

  // Delete communication
  delete: async (id: string) => {
    const docRef = doc(db, COMMUNICATIONS_COLLECTION, id);
    return deleteDoc(docRef);
  },

  // Update customer name in all related communications (denormalization sync)
  updateCustomerName: async (customerId: string, newName: string) => {
    const communications = await communicationService.getByCustomer(customerId);
    const promises = communications.map((comm) => {
      if (comm.id) {
        return communicationService.update(comm.id, { customerName: newName });
      }
      return Promise.resolve();
    });
    return Promise.all(promises);
  },
};
