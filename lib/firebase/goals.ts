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
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { getCollection } from './firestore';
import { Goal } from '@/lib/types';

const GOALS_COLLECTION = 'goals';

export const goalService = {
  // Get weekly goals
  getWeeklyGoals: async (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const q = query(
      getCollection<Goal>(GOALS_COLLECTION),
      where('type', '==', 'weekly'),
      where('weekStart', '>=', Timestamp.fromDate(weekStart)),
      where('weekStart', '<', Timestamp.fromDate(weekEnd)),
      orderBy('weekStart', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  },

  // Get monthly goals
  getMonthlyGoals: async (month: number, year: number) => {
    const q = query(
      getCollection<Goal>(GOALS_COLLECTION),
      where('type', '==', 'monthly'),
      where('month', '==', month),
      where('year', '==', year),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  },

  // Get yearly goals
  getYearlyGoals: async (year: number) => {
    const q = query(
      getCollection<Goal>(GOALS_COLLECTION),
      where('type', '==', 'yearly'),
      where('year', '==', year),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  },

  // Add new goal
  add: async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = serverTimestamp();
    return addDoc(getCollection<Goal>(GOALS_COLLECTION), {
      ...goal,
      createdAt: now as Timestamp,
      updatedAt: now as Timestamp,
    });
  },

  // Update goal
  update: async (id: string, data: Partial<Goal>) => {
    const docRef = doc(db, GOALS_COLLECTION, id);
    return updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete goal
  delete: async (id: string) => {
    const docRef = doc(db, GOALS_COLLECTION, id);
    return deleteDoc(docRef);
  },
};
