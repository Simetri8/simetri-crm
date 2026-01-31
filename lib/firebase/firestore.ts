import {
  collection,
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  Timestamp,
  WithFieldValue,
} from 'firebase/firestore';
import { db } from './config';

export const createConverter = <T>(): FirestoreDataConverter<T> => ({
  toFirestore(data: WithFieldValue<T>): DocumentData {
    return data as DocumentData;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): T {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      ...data,
    } as T;
  },
});

export const getCollection = <T>(collectionName: string) => {
  return collection(db, collectionName).withConverter(createConverter<T>());
};
