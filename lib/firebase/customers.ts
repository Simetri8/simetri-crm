import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { getCollection } from './firestore';
import { Customer } from '@/lib/types';
import { calculateTemperature } from '@/lib/utils/temperature';

const CUSTOMERS_COLLECTION = 'customers';

export const customerService = {
  // Get all customers
  getAll: async () => {
    const q = query(
      getCollection<Customer>(CUSTOMERS_COLLECTION),
      orderBy('lastContactDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  // Get single customer by ID
  getById: async (id: string) => {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as Customer;
  },

  // Add new customer
  add: async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'temperature'>) => {
    const now = serverTimestamp();
    const temperature = calculateTemperature(customer.lastContactDate?.toDate() || null);
    
    return addDoc(getCollection<Customer>(CUSTOMERS_COLLECTION), {
      ...customer,
      temperature,
      createdAt: now as Timestamp,
      updatedAt: now as Timestamp,
    });
  },

  // Update customer
  update: async (id: string, data: Partial<Customer>) => {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    const updates = { ...data, updatedAt: serverTimestamp() };
    
    // Recalculate temperature if date changed
    if (data.lastContactDate) {
      updates.temperature = calculateTemperature(data.lastContactDate instanceof Timestamp ? data.lastContactDate.toDate() : data.lastContactDate);
    }
    
    return updateDoc(docRef, updates);
  },

  // Delete customer
  delete: async (id: string) => {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    return deleteDoc(docRef);
  },
};
