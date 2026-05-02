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
  increment,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { createScopedQuery } from '../lib/firebaseUtils';
import { PurchaseOrder, ProductMovement } from '../domain/types';

const COLLECTION = 'purchaseOrders';

export const purchaseService = {
  async create(order: Omit<PurchaseOrder, 'id'>) {
    const user = auth.currentUser;
    return addDoc(collection(db, COLLECTION), {
      ...order,
      userId: user?.uid || 'guest',
      createdAt: Timestamp.now()
    });
  },

  async updateStatus(id: string, status: PurchaseOrder['status']) {
    const docRef = doc(db, COLLECTION, id);
    return updateDoc(docRef, { 
      status,
      receivedAt: status === 'recebido' ? Timestamp.now() : null
    });
  },

  async receiveOrder(order: PurchaseOrder, userId: string, userName: string) {
    if (order.status === 'recebido') return;

    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, COLLECTION, order.id!);
      
      // Update order status
      transaction.update(orderRef, { 
        status: 'recebido',
        receivedAt: Timestamp.now()
      });

      // Update stock for each product
      for (const item of order.items) {
        const productRef = doc(db, 'products', item.productId);
        transaction.update(productRef, {
          stock: increment(item.quantity),
          costPrice: item.costPrice // Auto-update cost price
        });

        // Add movement log
        const movementRef = doc(collection(db, 'productMovements'));
        const movement: Omit<ProductMovement, 'id'> = {
          productId: item.productId,
          productName: item.name,
          type: 'entrada',
          quantity: item.quantity,
          reason: `Compra #${order.purchaseNumber}`,
          userId,
          userName,
          timestamp: Timestamp.now()
        };
        transaction.set(movementRef, movement);
      }
    });
  },

  subscribeAll(uid: string, callback: (orders: PurchaseOrder[]) => void) {
    const q = createScopedQuery(collection(db, COLLECTION));
    return onSnapshot(q, (snap) => {
      const orders = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder))
        .sort((a, b) => {
          const tA = (a.createdAt as any)?.seconds || 0;
          const tB = (b.createdAt as any)?.seconds || 0;
          return tB - tA;
        });
      callback(orders);
    });
  }
};
