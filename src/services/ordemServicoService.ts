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
  runTransaction,
  where
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { ServiceOrder, SaleItem, CashSession, Sale } from '../domain/types';
import { logger } from './logService';
import { vendaService } from './vendaService';
import { createScopedQuery } from '../lib/firebaseUtils';

export const ordemServicoService = {
  // Get next OS number
  getNextOSNumber: async () => {
    const q = createScopedQuery(
      collection(db, 'serviceOrders')
    );
    const snap = await getDocs(q);
    if (snap.empty) return 1;
    const orders = snap.docs.map(doc => doc.data() as ServiceOrder);
    const maxNumber = Math.max(...orders.map(o => o.osNumber || 0));
    return maxNumber + 1;
  },

  // Create a new OS
  createOS: async (
    customerName: string, 
    bikeDetails: string, 
    problemDescription: string,
    entryDate: string,
    exitDate?: string,
    customerPhone?: string,
    items: SaleItem[] = [],
    customerId?: string,
    checklist?: { [key: string]: boolean }
  ) => {
    const user = auth.currentUser;
    
    const osNumber = await ordemServicoService.getNextOSNumber();
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    const osData: Omit<ServiceOrder, 'id'> = {
      osNumber,
      userId: user?.uid || 'guest',
      userName: user?.displayName || user?.email || 'Usuário Individual',
      customerId,
      customerName,
      customerPhone,
      bikeDetails,
      problemDescription,
      checklist,
      entryDate,
      exitDate,
      items,
      totalAmount,
      status: 'aberto',
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'serviceOrders'), osData);
    await logger.log('OS Criada', 'Serviços', `OS #${osNumber} - Cliente: ${customerName}`);
    return osNumber;
  },

  // Update OS general info
  updateOS: async (osId: string, data: Partial<ServiceOrder>) => {
    await updateDoc(doc(db, 'serviceOrders', osId), data);
    await logger.log('OS Atualizada', 'Serviços', `ID: ${osId}`);
  },

  // Update OS items and total
  updateItems: async (osId: string, items: SaleItem[]) => {
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    await updateDoc(doc(db, 'serviceOrders', osId), { 
      items, 
      totalAmount 
    });
  },

  // Update OS status
  updateStatus: async (osId: string, status: ServiceOrder['status']) => {
    const updateData: any = { status };
    if (status === 'finalizado') {
      updateData.finishedAt = serverTimestamp();
    } else if (status === 'entregue') {
      updateData.deliveredAt = serverTimestamp();
    }
    
    await updateDoc(doc(db, 'serviceOrders', osId), updateData);
    await logger.log('Status de OS Alterado', 'Serviços', `ID: ${osId} -> ${status}`);
  },

  // Convert OS to Sale
  convertToSale: async (os: ServiceOrder, paymentMethod: any, cashSessionId: string, userRole: string = 'admin') => {
    if (os.status !== 'finalizado' && os.status !== 'entregue') {
      throw new Error('A OS precisa estar finalizada para ser convertida em venda.');
    }

    // 1. Process the sale using vendaService.processSale
    // This handles stock, financial entry, and sale record correctly
    const result = await vendaService.processSale(
      os.customerName,
      os.items,
      paymentMethod,
      cashSessionId,
      os.customerId,
      userRole,
      true, // forcePending = true so it appears in cashier
      `Convertido da OS #${os.osNumber}`
    );
    
    const { saleNumber, saleId } = result;

    // 2. Update OS status and reference
    const osRef = doc(db, 'serviceOrders', os.id!);
    await updateDoc(osRef, {
      status: 'entregue',
      convertedToSaleId: saleId,
      deliveredAt: serverTimestamp()
    });

    await logger.log('OS Convertida', 'Serviços', `OS #${os.osNumber} convertida em Venda #${saleNumber}`);
    return { saleNumber, saleId };
  },

  // Listen to OS
  getServiceOrders: (callback: (orders: ServiceOrder[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'serviceOrders'), 
      limit(200)
    );
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ServiceOrder))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
      callback(orders);
    }, (error) => {
      console.error("Erro ao buscar ordens de serviço:", error);
    });
  }
};
