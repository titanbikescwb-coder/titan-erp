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
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { createScopedQuery } from '../lib/firebaseUtils';
import { Appointment } from '../domain/types';

const COLLECTION = 'appointments';

export const appointmentService = {
  async create(appointment: Omit<Appointment, 'id'>) {
    return addDoc(collection(db, COLLECTION), {
      ...appointment,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Timestamp.now()
    });
  },

  async update(id: string, data: Partial<Appointment>) {
    return updateDoc(doc(db, COLLECTION, id), data);
  },

  async delete(id: string) {
    return deleteDoc(doc(db, COLLECTION, id));
  },

  subscribeAll(uid: string, callback: (appointments: Appointment[]) => void) {
    const q = createScopedQuery(collection(db, COLLECTION));
    return onSnapshot(q, (snap) => {
      const appointments = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
        .filter(app => app.userId === uid)
        .sort((a, b) => {
          const tA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
          const tB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
          return tA - tB;
        });
      callback(appointments);
    }, (error) => {
      console.error("Firestore error in subscribeAll:", error);
    });
  },

  subscribeByDate(uid: string, date: Date, callback: (appointments: Appointment[]) => void) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = createScopedQuery(
      collection(db, COLLECTION),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
    });
  }
};
