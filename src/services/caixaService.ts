import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  serverTimestamp, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  where
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { CashSession, CashMovement, Sale } from '../domain/types';
import { logger } from './logService';
import { createScopedQuery } from '../lib/firebaseUtils';

export const caixaService = {
  // Get current open session for the logged user
  getCurrentSession: (callback: (session: CashSession | null) => void) => {
    const q = createScopedQuery(
      collection(db, 'cashSessions'),
      where('status', '==', 'open'),
      limit(1)
    );

    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
      } else {
        const docData = snapshot.docs[0];
        callback({ id: docData.id, ...docData.data() } as CashSession);
      }
    });
  },

  // Open a new session
  openSession: async (initialValue: number) => {
    const user = auth.currentUser;
    // Check if there is already an open session
    const q = createScopedQuery(
      collection(db, 'cashSessions'),
      where('status', '==', 'open')
    );
    const existing = await getDocs(q);
    if (!existing.empty) throw new Error('Você já possui um caixa aberto');

    const sessionData: Omit<CashSession, 'id'> = {
      userId: user?.uid || 'guest',
      userName: user?.displayName || user?.email || 'Usuário Individual',
      openedAt: serverTimestamp(),
      initialValue,
      totalMovementsIn: 0,
      totalMovementsOut: 0,
      status: 'open'
    };

    const docRef = await addDoc(collection(db, 'cashSessions'), sessionData);
    await logger.log('Abertura de Caixa', 'Caixa', `Valor inicial: R$ ${initialValue.toFixed(2)}`);
    return docRef.id;
  },

  // Close session
  closeSession: async (sessionId: string, cash: number, card: number, pix: number) => {
    await updateDoc(doc(db, 'cashSessions', sessionId), {
      closedAt: serverTimestamp(),
      finalValueCash: cash,
      finalValueCard: card,
      finalValuePix: pix,
      status: 'closed'
    });
    await logger.log('Fechamento de Caixa', 'Caixa', `Dinheiro: ${cash}, Cartão: ${card}, Pix: ${pix}`);
  },

  // Add movement (suprimento/sangria)
  addMovement: async (sessionId: string, type: 'suprimento' | 'sangria', amount: number, reason: string) => {
    const user = auth.currentUser;

    const movement: Omit<CashMovement, 'id'> = {
      sessionId,
      userId: user?.uid || 'guest',
      type,
      amount,
      reason,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'cashMovements'), movement);

    // Update session totals
    const sessionRef = doc(db, 'cashSessions', sessionId);
    const sessionSnap = await getDocs(createScopedQuery(
      collection(db, 'cashSessions'), 
      where('__name__', '==', sessionId)
    ));
    if (!sessionSnap.empty) {
      const currentData = sessionSnap.docs[0].data() as CashSession;
      if (type === 'suprimento') {
        await updateDoc(sessionRef, { totalMovementsIn: (currentData.totalMovementsIn || 0) + amount });
      } else {
        await updateDoc(sessionRef, { totalMovementsOut: (currentData.totalMovementsOut || 0) + amount });
      }
    }

    await logger.log(type === 'suprimento' ? 'Suprimento de Caixa' : 'Sangria de Caixa', 'Caixa', `Valor: R$ ${amount.toFixed(2)} - Motivo: ${reason}`);
  },

  // Get movements for a session
  getMovements: (sessionId: string, callback: (movements: CashMovement[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'cashMovements'),
      where('sessionId', '==', sessionId),
      limit(80)
    );

    return onSnapshot(q, (snapshot) => {
      const movements = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as CashMovement))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA; // desc
        });
      callback(movements);
    });
  },

  // Get history
  getHistory: (callback: (sessions: CashSession[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'cashSessions'),
      where('status', '==', 'closed'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as CashSession))
        .sort((a, b) => {
          const tA = (a.openedAt as any)?.seconds || 0;
          const tB = (b.openedAt as any)?.seconds || 0;
          return tB - tA; // desc
        })
        .slice(0, 15);
      callback(sessions);
    });
  },

  // Get session payment totals for report
  getSessionPaymentTotals: async (sessionId: string) => {
    // Only filter by sessionId to avoid composite index errors with status/paymentStatus
    const q = createScopedQuery(
      collection(db, 'sales'),
      where('cashSessionId', '==', sessionId)
    );
    
    const snap = await getDocs(q);
    const totals = {
      dinheiro: 0,
      cartao_credito: 0,
      cartao_debito: 0,
      pix: 0
    };

    snap.forEach(doc => {
      const data = doc.data() as Sale;
      // Filter in memory to avoid composite index
      if (data.status === 'FINALIZADA' && data.paymentStatus === 'CONFIRMADO') {
        if (data.payments && Array.isArray(data.payments) && data.payments.length > 0) {
          data.payments.forEach(p => {
            if (p.method in totals) {
              totals[p.method as keyof typeof totals] += p.amount;
            }
          });
        } else if (data.paymentMethod && data.paymentMethod in totals) {
          totals[data.paymentMethod as keyof typeof totals] += data.totalAmount;
        }
      }
    });

    return totals;
  }
};
