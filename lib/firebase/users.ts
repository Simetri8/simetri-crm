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

const WHITELIST_COLLECTION = 'whitelist';
const USERS_COLLECTION = 'users';

export const userService = {
  // Check if an email is in the whitelist
  isWhitelisted: async (email: string): Promise<boolean> => {
    if (!email) return false;
    const docRef = doc(db, WHITELIST_COLLECTION, email);
    const snapshot = await getDoc(docRef);
    return snapshot.exists();
  },

  // Get all whitelisted emails (for admin management UI)
  getAll: async (): Promise<User[]> => {
    const q = query(
      getCollection<User>(WHITELIST_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id, // doc ID = email address
    }));
  },

  // Add an email to whitelist
  addToWhitelist: async (email: string, displayName: string = '') => {
    const docRef = doc(db, WHITELIST_COLLECTION, email);
    return setDoc(docRef, {
      email,
      displayName,
      photoURL: null,
      createdAt: serverTimestamp() as Timestamp,
    });
  },

  // Remove from whitelist
  removeFromWhitelist: async (email: string) => {
    const docRef = doc(db, WHITELIST_COLLECTION, email);
    return deleteDoc(docRef);
  },

  // Create or update user document with Firebase Auth UID (called on login)
  ensureUserDoc: async (user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) => {
    const docRef = doc(db, USERS_COLLECTION, user.uid);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      await setDoc(docRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp() as Timestamp,
      });
    } else {
      await setDoc(docRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      }, { merge: true });
    }
  },

  // Get all registered users (UID-based, for assignee dropdowns)
  getAllUsers: async (): Promise<User[]> => {
    const q = query(
      getCollection<User>(USERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id,
    }));
  },
};
