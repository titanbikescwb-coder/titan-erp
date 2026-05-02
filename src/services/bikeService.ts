import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { createScopedQuery } from '../lib/firebaseUtils';
import { Bike } from '../domain/types';

const COLLECTION = 'bikes';

export const bikeService = {
  async create(bike: Omit<Bike, 'id'>) {
    return addDoc(collection(db, COLLECTION), {
      ...bike,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Timestamp.now()
    });
  },

  async update(id: string, data: Partial<Bike>) {
    return updateDoc(doc(db, COLLECTION, id), data);
  },

  subscribeAll(uid: string, callback: (bikes: Bike[]) => void) {
    const q = createScopedQuery(collection(db, COLLECTION));
    return onSnapshot(q, (snap) => {
      const bikes = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Bike))
        .sort((a, b) => a.model.localeCompare(b.model));
      callback(bikes);
    });
  },

  subscribeByCustomer(uid: string, customerId: string, callback: (bikes: Bike[]) => void) {
    const q = createScopedQuery(
      collection(db, COLLECTION), 
      where('customerId', '==', customerId)
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bike)));
    });
  },

  async getBySerialNumber(uid: string, serialNumber: string) {
    const q = createScopedQuery(
      collection(db, COLLECTION),
      where('serialNumber', '==', serialNumber.toUpperCase())
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Bike;
  }
};
