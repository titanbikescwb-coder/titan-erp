import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  updateDoc,
  doc,
  getDocs
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { createScopedQuery } from '../lib/firebaseUtils';
import { Commission, Sale, ServiceOrder, UserProfile } from '../domain/types';

const COLLECTION = 'commissions';

export const commissionService = {
  async calculateForSale(sale: Sale, employee: UserProfile) {
    if (!employee.commissionRate || employee.commissionRate <= 0) return;

    // Calculate commission only on services or total depending on policy
    // Here we use total as example
    const commissionAmount = sale.totalAmount * (employee.commissionRate / 100);

    const commission: Omit<Commission, 'id'> = {
      userId: auth.currentUser?.uid || 'guest',
      employeeId: employee.uid,
      employeeName: employee.name,
      saleId: sale.id!,
      saleNumber: sale.saleNumber,
      amount: commissionAmount,
      percentage: employee.commissionRate,
      status: 'pendente',
      timestamp: Timestamp.now()
    };

    return addDoc(collection(db, COLLECTION), commission);
  },

  async calculateForOS(os: ServiceOrder, employee: UserProfile) {
    if (!employee.commissionRate || employee.commissionRate <= 0) return;

    const commissionAmount = os.totalAmount * (employee.commissionRate / 100);

    const commission: Omit<Commission, 'id'> = {
      userId: auth.currentUser?.uid || 'guest',
      employeeId: employee.uid,
      employeeName: employee.name,
      saleId: os.id!, // Using saleId field for OS as well
      saleNumber: os.osNumber,
      amount: commissionAmount,
      percentage: employee.commissionRate,
      status: 'pendente',
      timestamp: Timestamp.now()
    };

    return addDoc(collection(db, COLLECTION), commission);
  },

  subscribeAll(uid: string, callback: (commissions: Commission[]) => void) {
    const q = createScopedQuery(collection(db, COLLECTION), where('status', '==', 'pendente'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Commission)));
    });
  },

  async payCommission(id: string) {
    return updateDoc(doc(db, COLLECTION, id), {
      status: 'pago',
      paymentDate: Timestamp.now()
    });
  }
};
