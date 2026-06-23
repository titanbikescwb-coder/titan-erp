import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  onSnapshot,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Customer } from '../domain/types';
import { logger } from './logService';
import { createScopedQuery } from '../lib/firebaseUtils';

export const clienteService = {
  getCustomers: (callback: (customers: Customer[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'customers')
    );
    return onSnapshot(q, (snapshot) => {
      const customers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Customer))
        .sort((a, b) => a.name.localeCompare(b.name));
      callback(customers);
    });
  },

  addCustomer: async (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customer,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: serverTimestamp()
    });
    await logger.log('Cliente Cadastrado', 'Cadastros', `Cliente: ${customer.name}`);
    return docRef.id;
  },

  updateCustomer: async (customerId: string, data: Partial<Customer>) => {
    await updateDoc(doc(db, 'customers', customerId), data);
    await logger.log('Cliente Atualizado', 'Cadastros', `ID: ${customerId}`);
  },

  deleteCustomer: async (customerId: string) => {
    await deleteDoc(doc(db, 'customers', customerId));
    await logger.log('Cliente Excluído', 'Cadastros', `ID: ${customerId}`);
  }
};
