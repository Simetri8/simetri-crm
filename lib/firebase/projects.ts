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
import { Project } from '@/lib/types';

const PROJECTS_COLLECTION = 'projects';

export const projectService = {
  // Get all projects
  getAll: async () => {
    const q = query(
      getCollection<Project>(PROJECTS_COLLECTION),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  // Get projects by status
  getByStatus: async (status: Project['status']) => {
    const q = query(
      getCollection<Project>(PROJECTS_COLLECTION),
      where('status', '==', status),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  // Get single project by ID
  getById: async (id: string) => {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as Project;
  },

  // Get projects by customer
  getByCustomer: async (customerId: string) => {
    const q = query(
      getCollection<Project>(PROJECTS_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  },

  // Add new project
  add: async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = serverTimestamp();
    return addDoc(getCollection<Project>(PROJECTS_COLLECTION), {
      ...project,
      createdAt: now as Timestamp,
      updatedAt: now as Timestamp,
    });
  },

  // Update project
  update: async (id: string, data: Partial<Project>) => {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    return updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete project
  delete: async (id: string) => {
    const docRef = doc(db, PROJECTS_COLLECTION, id);
    return deleteDoc(docRef);
  },

  // Update customer name in all related projects (denormalization sync)
  updateCustomerName: async (customerId: string, newName: string) => {
    const projects = await projectService.getByCustomer(customerId);
    const promises = projects.map((project) => {
      if (project.id) {
        return projectService.update(project.id, { customerName: newName });
      }
      return Promise.resolve();
    });
    return Promise.all(promises);
  },
};
