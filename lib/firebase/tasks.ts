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
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { getCollection } from './firestore';
import { Task } from '@/lib/types';

const TASKS_COLLECTION = 'tasks';

export const taskService = {
  // Get all tasks for a project
  getByProject: async (projectId: string) => {
    const q = query(
      getCollection<Task>(TASKS_COLLECTION),
      where('projectId', '==', projectId),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  // Get tasks by status
  getByStatus: async (projectId: string, status: Task['status']) => {
    const q = query(
      getCollection<Task>(TASKS_COLLECTION),
      where('projectId', '==', projectId),
      where('status', '==', status),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  // Get tasks for weekly plan
  getWeeklyTasks: async (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const q = query(
      getCollection<Task>(TASKS_COLLECTION),
      where('weeklyPlanDate', '>=', Timestamp.fromDate(weekStart)),
      where('weeklyPlanDate', '<', Timestamp.fromDate(weekEnd)),
      orderBy('weeklyPlanDate', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  // Get recently completed tasks
  getRecentlyCompleted: async (limit: number = 10) => {
    const q = query(
      getCollection<Task>(TASKS_COLLECTION),
      where('status', '==', 'done'),
      orderBy('completedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, limit).map((doc) => doc.data());
  },

  // Add new task
  add: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>) => {
    const now = serverTimestamp();
    return addDoc(getCollection<Task>(TASKS_COLLECTION), {
      ...task,
      completedAt: null,
      createdAt: now as Timestamp,
      updatedAt: now as Timestamp,
    });
  },

  // Update task
  update: async (id: string, data: Partial<Task>) => {
    const docRef = doc(db, TASKS_COLLECTION, id);
    const updates: Partial<Task> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
      ...data,
      updatedAt: serverTimestamp() as Timestamp,
    };

    // Set completedAt when task is marked as done
    if (data.status === 'done') {
      updates.completedAt = serverTimestamp() as Timestamp;
    } else if (data.status) {
      updates.completedAt = null;
    }

    return updateDoc(docRef, updates);
  },

  // Delete task
  delete: async (id: string) => {
    const docRef = doc(db, TASKS_COLLECTION, id);
    return deleteDoc(docRef);
  },

  // Reorder tasks
  reorder: async (tasks: { id: string; order: number }[]) => {
    const batch = writeBatch(db);
    tasks.forEach(({ id, order }) => {
      const docRef = doc(db, TASKS_COLLECTION, id);
      batch.update(docRef, { order, updatedAt: serverTimestamp() });
    });
    return batch.commit();
  },

  // Assign task to weekly plan
  assignToWeek: async (id: string, weekStart: Date | null) => {
    const docRef = doc(db, TASKS_COLLECTION, id);
    return updateDoc(docRef, {
      weeklyPlanDate: weekStart ? Timestamp.fromDate(weekStart) : null,
      updatedAt: serverTimestamp(),
    });
  },

  // Update project name in all related tasks (denormalization sync)
  updateProjectName: async (projectId: string, newName: string) => {
    const tasks = await taskService.getByProject(projectId);
    const batch = writeBatch(db);
    tasks.forEach((task) => {
      if (task.id) {
        const docRef = doc(db, TASKS_COLLECTION, task.id);
        batch.update(docRef, { projectName: newName, updatedAt: serverTimestamp() });
      }
    });
    return batch.commit();
  },

  // Get max order for a project
  getMaxOrder: async (projectId: string): Promise<number> => {
    const tasks = await taskService.getByProject(projectId);
    if (tasks.length === 0) return 0;
    return Math.max(...tasks.map((t) => t.order));
  },
};
