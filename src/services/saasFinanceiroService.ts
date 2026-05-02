import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { SaaS_Venda, SaaS_Caixa } from '../domain/types';
import { createScopedQuery } from '../lib/firebaseUtils';

export const saasFinanceiroService = {
  // Get vendas for a specific user (or current user if not provided)
  getVendas: (targetUserId?: string, callback?: (vendas: SaaS_Venda[]) => void) => {
    // If targetUserId is provided (admin drill-down), we use a direct query
    if (targetUserId) {
      const q = query(collection(db, 'vendas'), where('userId', '==', targetUserId));
      return onSnapshot(q, (snapshot) => {
        const vendas = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as SaaS_Venda))
          .sort((a, b) => {
            const tA = (a.createdAt as any)?.seconds || 0;
            const tB = (b.createdAt as any)?.seconds || 0;
            return tB - tA;
          });
        if (callback) callback(vendas);
      });
    }

    // Otherwise use the scoped query helper
    const q = createScopedQuery(collection(db, 'vendas'));
    return onSnapshot(q, (snapshot) => {
      const vendas = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as SaaS_Venda))
        .sort((a, b) => {
          const tA = (a.createdAt as any)?.seconds || 0;
          const tB = (b.createdAt as any)?.seconds || 0;
          return tB - tA;
        });
      if (callback) callback(vendas);
    });
  },

  // Get caixa movements for a specific user
  getCaixa: (targetUserId?: string, callback?: (caixa: SaaS_Caixa[]) => void) => {
    if (targetUserId) {
      const q = query(collection(db, 'caixa'), where('userId', '==', targetUserId));
      return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as SaaS_Caixa))
          .sort((a, b) => {
            const tA = (a.date as any)?.seconds || 0;
            const tB = (b.date as any)?.seconds || 0;
            return tB - tA;
          });
        if (callback) callback(entries);
      });
    }

    const q = createScopedQuery(collection(db, 'caixa'));
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as SaaS_Caixa))
        .sort((a, b) => {
          const tA = (a.date as any)?.seconds || 0;
          const tB = (b.date as any)?.seconds || 0;
          return tB - tA;
        });
      if (callback) callback(entries);
    });
  },

  // Add a new venda
  addVenda: async (total: number, status: SaaS_Venda['status'] = 'finalizado') => {
    const user = auth.currentUser;
    const userId = user?.uid || 'guest';

    const venda: Omit<SaaS_Venda, 'id'> = {
      total,
      status,
      createdAt: serverTimestamp(),
      userId
    };

    return await addDoc(collection(db, 'vendas'), venda);
  },

  // Add a new caixa entry
  addCaixa: async (type: SaaS_Caixa['type'], origin: SaaS_Caixa['origin'], value: number) => {
    const user = auth.currentUser;
    const userId = user?.uid || 'guest';

    const entry: Omit<SaaS_Caixa, 'id'> = {
      type,
      origin,
      value,
      date: serverTimestamp(),
      userId
    };

    return await addDoc(collection(db, 'caixa'), entry);
  }
};
