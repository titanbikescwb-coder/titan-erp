import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  orderBy, 
  limit,
  runTransaction,
  doc,
  onSnapshot,
  where,
  getDocs,
  query,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Sale, SaleItem, CashSession } from '../domain/types';
import { logger } from './logService';
import { financeiroService } from './financeiroService';
import { createScopedQuery } from '../lib/firebaseUtils';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: null, // Unified system uses userId for multi-tenancy
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const vendaService = {
  // Get next sale number
  getNextSaleNumber: async () => {
    try {
      const q = createScopedQuery(
        collection(db, 'sales')
      );
      const snap = await getDocs(q);
      if (snap.empty) return 1;
      const sales = snap.docs.map(doc => doc.data() as Sale);
      const maxNumber = Math.max(...sales.map(s => s.saleNumber || 0));
      return maxNumber + 1;
    } catch (error) {
      console.warn("Erro ao buscar próximo número de venda (offline):", error);
      if (error instanceof Error && error.message.includes('insufficient permissions')) {
        handleFirestoreError(error, OperationType.GET, 'sales');
      }
      // Fallback: use timestamp as temporary number or just return a high random number
      return Math.floor(Date.now() / 1000);
    }
  },

  // Process a complete sale
processSale: async (
  customerName: string, 
  items: SaleItem[], 
  paymentMethod: Sale['paymentMethod'],
  cashSessionId: string,
  customerId?: string,
  userRole: string = 'admin',
  forcePending: boolean = false,
  notes?: string,
  payments?: Sale['payments'],
  finalAmount?: number,
discountInfo?: {
  subtotal: number;
  discountType: 'value' | 'percent';
  discountValue: number;
  discountAmount: number;
}
) => {
    const user = auth.currentUser;
    const subtotal = items.reduce(
  (sum, item) => sum + item.totalPrice,
  0
);

const totalAmount = finalAmount ?? subtotal;
    const saleNumber = await vendaService.getNextSaleNumber();

    // Role-based status logic - If forced or not admin/caixa role, mark as pending
    const paymentStatus: Sale['paymentStatus'] = forcePending ? 'PENDENTE' : 'CONFIRMADO';
    const status: Sale['status'] = 'FINALIZADA';
    const saleRef = doc(collection(db, 'sales'));
    // Use a transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
      // 1. COLLECT ALL READS FIRST
      const sessionRef = doc(db, 'cashSessions', cashSessionId);
      const sessionSnap = await transaction.get(sessionRef);
      if (!sessionSnap.exists()) throw new Error('Sessão de caixa não encontrada');
      const sessionData = sessionSnap.data() as CashSession;

      const productReads: { ref: any, snap: any, item: SaleItem }[] = [];
      for (const item of items) {
        if (item.type === 'product') {
          const productRef = doc(db, 'products', item.itemId);
          const productSnap = await transaction.get(productRef);
          productReads.push({ ref: productRef, snap: productSnap, item });
        }
      }

      // 2. VALIDATE ALL READS
      for (const read of productReads) {
        if (!read.snap.exists()) throw new Error(`Produto ${read.item.name} não encontrado`);
        const currentStock = read.snap.data().stock;
        if (currentStock < read.item.quantity) {
          throw new Error(`Estoque insuficiente para ${read.item.name}. Disponível: ${currentStock}`);
        }
      }

      // 3. PERFORM ALL WRITES
      // Update Stock
      for (const read of productReads) {
        transaction.update(read.ref, { stock: read.snap.data().stock - read.item.quantity });
      }

      // Create Financial Entry
      const finRef = doc(collection(db, 'financialEntries'));
      const finalPayments = payments || [{ method: paymentMethod || 'dinheiro', amount: totalAmount }];
      
      transaction.set(finRef, {
        type: 'receita',
        amount: totalAmount,
        description: `Venda #${saleNumber} - ${customerName}`,
        category: 'Vendas',
        date: serverTimestamp(),
        dueDate: serverTimestamp(),
        status: paymentStatus === 'CONFIRMADO' ? 'pago' : 'pendente',
        saleId: saleRef.id,
        userId: user?.uid || 'guest',
        payments: finalPayments
      });

      const saleData: any = {
  saleNumber,
  userId: user?.uid || 'guest',
  userName: user?.displayName || user?.email || 'Usuário Individual',
  customerId: customerId || null,
  customerName,
  items,
  subtotal: discountInfo?.subtotal ?? totalAmount,
  discountType: discountInfo?.discountType ?? null,
  discountValue: discountInfo?.discountValue ?? 0,
  discountAmount: discountInfo?.discountAmount ?? 0,
  totalAmount,
  paymentMethod: paymentMethod || 'dinheiro',
  payments: finalPayments,
  status,
  paymentStatus,
  timestamp: serverTimestamp(),
  cashSessionId,
  financialEntryId: finRef.id,
  notes: notes || ''
};
      transaction.set(saleRef, saleData);

      // Log Stock Movements
      for (const item of items) {
        if (item.type === 'product') {
          const movementRef = doc(collection(db, 'productMovements'));
          transaction.set(movementRef, {
            productId: item.itemId,
            productName: item.name,
            type: 'venda',
            quantity: item.quantity,
            reason: `Venda #${saleNumber}`,
            userId: user?.uid || 'guest',
            userName: user?.displayName || user?.email || 'Usuário Individual',
            timestamp: serverTimestamp()
          });
        }
      }

      // Register Cash Movement
      if (paymentStatus === 'CONFIRMADO') {
        const cashMovementRef = doc(collection(db, 'cashMovements'));
        transaction.set(cashMovementRef, {
          sessionId: cashSessionId,
          userId: user?.uid || 'guest',
          type: 'suprimento',
          amount: totalAmount,
          reason: `Venda #${saleNumber} - ${customerName}`,
          timestamp: serverTimestamp(),
          saleId: saleRef.id
        });

        // Update Cash Session totals
        transaction.update(sessionRef, { 
          totalMovementsIn: (sessionData.totalMovementsIn || 0) + totalAmount 
        });
      }
    });

    // await logger.log('Venda Realizada', 'Vendas', `Venda #${saleNumber} - Total: R$ ${totalAmount.toFixed(2)} - Pagamento: ${paymentStatus}`);
    return { saleNumber, saleId: saleRef.id };
  },

  getRecentSales: (callback: (sales: Sale[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'sales'), 
      limit(80)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Sale))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
      callback(sales.slice(0, 50));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sales');
    });
    return unsub;
  },

  getPendingSales: (callback: (sales: Sale[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'sales'), 
      where('paymentStatus', '==', 'PENDENTE')
    );
    return onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Sale))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA; // desc
        });
      callback(sales);
    }, (error) => {
      console.error("Firestore error in getPendingSales:", error);
    });
  },

  getSalesByPeriod: (days: number, callback: (sales: Sale[]) => void) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startTs = startDate.getTime();

    const q = createScopedQuery(
      collection(db, 'sales'),
      limit(300)
    );
    return onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Sale))
        .filter(sale => {
          if (!sale.timestamp) return false;
          const date = sale.timestamp.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp);
          return date.getTime() >= startTs;
        })
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
      callback(sales);
    }, (error) => {
      console.error("Erro ao buscar vendas por período:", error);
    });
  },

  getSalesByDateRange: (start: Date, end: Date, callback: (sales: Sale[]) => void, errorCallback?: (error: any) => void) => {
    // We query by userId (via createScopedQuery) and filter date in memory to avoid composite index requirements
    const q = createScopedQuery(
      collection(db, 'sales'), 
      limit(300)
    );
    
    const startTs = start.getTime();
    const endTs = end.getTime() + (24 * 60 * 60 * 1000) - 1; // End of day

    return onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Sale))
        .filter(sale => {
          if (!sale.timestamp) return false;
          // Handle both Firestore Timestamp and Date serialization
          const date = sale.timestamp.toDate ? sale.timestamp.toDate() : new Date(sale.timestamp);
          const ts = date.getTime();
          return ts >= startTs && ts <= endTs;
        });

      // Sort in memory to avoid index requirement
      sales.sort((a, b) => {
        const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
        const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
        return tB - tA;
      });
      
      callback(sales);
    }, (error) => {
      console.error("Erro ao buscar vendas por intervalo de datas (Index needed?):", error);
      if (errorCallback) errorCallback(error);
    });
  },

  confirmPayment: async (saleId: string, cashSessionId: string, userRole: string = 'admin') => {
    const user = auth.currentUser;

    // 1. Get Sale Data first to check status and get financialEntryId
    const saleRef = doc(db, 'sales', saleId);
    const saleSnap = await getDocs(query(collection(db, 'sales'), where('__name__', '==', saleId)));
    
    if (saleSnap.empty) throw new Error('Venda não encontrada');
    const saleData = saleSnap.docs[0].data() as Sale;

    if (saleData.paymentStatus === 'CONFIRMADO') {
      throw new Error('Pagamento já confirmado');
    }

    // 2. Find Financial Entry if ID is missing (fallback)
    let finEntryId = saleData.financialEntryId;
    if (!finEntryId) {
      const finQuery = query(
        collection(db, 'financialEntries'), 
        where('saleId', '==', saleId)
      );
      const finSnap = await getDocs(finQuery);
      if (!finSnap.empty) {
        finEntryId = finSnap.docs[0].id;
      }
    }

    // 3. Perform atomic updates in transaction
    await runTransaction(db, async (transaction) => {
      const sessionRef = doc(db, 'cashSessions', cashSessionId);
      const sessionSnap = await transaction.get(sessionRef);
      if (!sessionSnap.exists()) throw new Error('Sessão de caixa não encontrada');
      const sessionData = sessionSnap.data() as CashSession;

      // Update Sale
      transaction.update(saleRef, { paymentStatus: 'CONFIRMADO' });

      // Update Financial Entry
      if (finEntryId) {
        const finRef = doc(db, 'financialEntries', finEntryId);
        transaction.update(finRef, { status: 'pago' });
      }

      // Register Cash Movement
      const cashMovementRef = doc(collection(db, 'cashMovements'));
      transaction.set(cashMovementRef, {
        sessionId: cashSessionId,
        userId: user?.uid || 'guest',
        type: 'suprimento',
        amount: saleData.totalAmount,
        reason: `Venda #${saleData.saleNumber} - ${saleData.customerName} (Confirmado)`,
        timestamp: serverTimestamp(),
        saleId: saleId
      });

      // Update Cash Session totals
      transaction.update(sessionRef, { 
        totalMovementsIn: (sessionData.totalMovementsIn || 0) + saleData.totalAmount 
      });
    });

    await logger.log('Pagamento Confirmado', 'Caixa', `Venda ID: ${saleId}`);
  }
};
