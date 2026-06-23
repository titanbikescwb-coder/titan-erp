import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { createScopedQuery } from '../lib/firebaseUtils';

export type LeadStatus = 'novo' | 'contato' | 'proposta' | 'fechado' | 'perdido';

export interface Lead {
  id?: string;
  userId?: string;
  name: string;
  email?: string;
  phone: string;
  status: LeadStatus;
  value?: number;
  source?: string;
  notes?: string;
  lastContact?: any;
  createdAt: any;
  updatedAt: any;
}

const COLLECTION = 'leads';

export const crmService = {
  async create(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) {
    const user = auth.currentUser;

    return addDoc(collection(db, COLLECTION), {
      ...lead,
      userId: user?.uid || 'guest',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  },

  async updateStatus(id: string, status: LeadStatus) {
    return updateDoc(doc(db, COLLECTION, id), { 
      status, 
      updatedAt: Timestamp.now() 
    });
  },

  subscribeAll(uid: string, callback: (leads: Lead[]) => void) {
    const q = createScopedQuery(collection(db, COLLECTION));
    return onSnapshot(q, (snap) => {
      const leads = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Lead))
        .sort((a, b) => {
          const tA = (a.updatedAt as any)?.seconds || 0;
          const tB = (b.updatedAt as any)?.seconds || 0;
          return tB - tA;
        });
      callback(leads);
    });
  }
};
