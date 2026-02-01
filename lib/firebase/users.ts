import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { getCollection } from './firestore';
import { User } from '@/lib/types';

const USERS_COLLECTION = 'users';

export const userService = {
  // Check if a user is whitelisted by email
  // Note: Firestore doesn't allow querying by ID directly in a simple way if we don't know the ID,
  // but since we use email as the ID or a field, we can check it.
  // For this implementation, we'll assume the user document ID is their UID, 
  // but we also want to check by email for the whitelist.
  
  isWhitelisted: async (email: string): Promise<boolean> => {
    if (!email) return false;
    
    // We'll look for a document in 'users' collection where email matches
    const q = query(
      getCollection<User>(USERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.some(doc => doc.data().email === email);
  },

  // Get all whitelisted users
  getAll: async (): Promise<User[]> => {
    const q = query(
      getCollection<User>(USERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    }));
  },

  // Add a user to whitelist
  addToWhitelist: async (email: string, displayName: string = '') => {
    // We use email as a way to identify, but we'll create a doc with a generated ID or email
    const id = email.replace(/[^a-zA-Z0-9]/g, '_'); // Simple ID from email
    const docRef = doc(db, USERS_COLLECTION, id);
    
    return setDoc(docRef, {
      email,
      displayName,
      photoURL: null,
      createdAt: serverTimestamp() as Timestamp,
    });
  },

  // Remove from whitelist
  removeFromWhitelist: async (id: string) => {
    const docRef = doc(db, USERS_COLLECTION, id);
    return deleteDoc(docRef);
  }
};
