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
import { Supplier } from '../domain/types';
import { logger } from './logService';
import { createScopedQuery } from '../lib/firebaseUtils';

export const fornecedorService = {
  getSuppliers: (callback: (suppliers: Supplier[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'suppliers')
    );
    return onSnapshot(q, (snapshot) => {
      const suppliers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Supplier))
        .sort((a, b) => a.name.localeCompare(b.name));
      callback(suppliers);
    });
  },

  addSupplier: async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, 'suppliers'), {
      ...supplier,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: serverTimestamp()
    });
    await logger.log('Fornecedor Cadastrado', 'Cadastros', `Fornecedor: ${supplier.name}`);
    return docRef.id;
  },

  updateSupplier: async (supplierId: string, data: Partial<Supplier>) => {
    await updateDoc(doc(db, 'suppliers', supplierId), data);
    await logger.log('Fornecedor Atualizado', 'Cadastros', `ID: ${supplierId}`);
  },

  deleteSupplier: async (supplierId: string) => {
    await deleteDoc(doc(db, 'suppliers', supplierId));
    await logger.log('Fornecedor Excluído', 'Cadastros', `ID: ${supplierId}`);
  }
};
