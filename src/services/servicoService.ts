import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  orderBy,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { ServiceItem } from '../domain/types';
import { logger } from './logService';
import { createScopedQuery } from '../lib/firebaseUtils';

export const servicoService = {
  getServices: (callback: (services: ServiceItem[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'serviceItems')
    );
    return onSnapshot(q, (snapshot) => {
      const services = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ServiceItem))
        .sort((a, b) => a.name.localeCompare(b.name));
      callback(services);
    });
  },

  addService: async (service: Omit<ServiceItem, 'id'>) => {
    const docRef = await addDoc(collection(db, 'serviceItems'), {
      ...service,
      userId: auth.currentUser?.uid || 'guest'
    });
    await logger.log('Serviço Cadastrado', 'Cadastros', `Serviço: ${service.name}`);
    return docRef.id;
  },

  updateService: async (id: string, service: Partial<ServiceItem>) => {
    const docRef = doc(db, 'serviceItems', id);
    await updateDoc(docRef, service);
    await logger.log('Serviço Atualizado', 'Cadastros', `Serviço: ${service.name}`);
  },

  deleteService: async (id: string) => {
    const docRef = doc(db, 'serviceItems', id);
    await deleteDoc(docRef);
    await logger.log('Serviço Excluído', 'Cadastros', `ID: ${id}`);
  }
};
