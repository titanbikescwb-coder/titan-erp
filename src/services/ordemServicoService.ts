import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  serverTimestamp, 
  limit,
  onSnapshot
} from 'firebase/firestore';

import { db, auth } from '../firebase/config';
import { ServiceOrder, SaleItem } from '../domain/types';
import { vendaService } from './vendaService';
import { createScopedQuery } from '../lib/firebaseUtils';

export const ordemServicoService = {
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

  createOS: async (
    customerName: string,
    bikeDetails: string,
    problemDescription: string,
    entryDate: string,
    exitDate?: string,
    customerPhone?: string,
    items: SaleItem[] = [],
    customerId?: string
  ) => {
    const user = auth.currentUser;

    const osNumber = await ordemServicoService.getNextOSNumber();

    const totalAmount = items.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    const osData: Omit<ServiceOrder, 'id'> = {
      osNumber,
      userId: user?.uid || 'guest',
      userName: user?.displayName || user?.email || 'Usuário Individual',
      customerId,
      customerName,
      customerPhone,
      bikeDetails,
      problemDescription,
      entryDate,
      exitDate,
      items,
      totalAmount,
      status: 'aberto',
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'serviceOrders'), osData);

    return osNumber;
  },

  updateOS: async (osId: string, data: Partial<ServiceOrder>) => {
    await updateDoc(doc(db, 'serviceOrders', osId), data);
  },

  updateItems: async (osId: string, items: SaleItem[]) => {
    const totalAmount = items.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    await updateDoc(doc(db, 'serviceOrders', osId), {
      items,
      totalAmount
    });
  },

  updateStatus: async (
    osId: string,
    status: ServiceOrder['status']
  ) => {
    const updateData: any = { status };

    if (status === 'finalizado') {
      updateData.finishedAt = serverTimestamp();
    } else if (status === 'entregue') {
      updateData.deliveredAt = serverTimestamp();
    }

    await updateDoc(doc(db, 'serviceOrders', osId), updateData);
  },

  convertToSale: async (
    os: ServiceOrder,
    paymentMethod: any,
    cashSessionId: string,
    userRole: string = 'admin'
  ) => {
    if (
      os.status !== 'finalizado' &&
      os.status !== 'entregue'
    ) {
      throw new Error(
        'A OS precisa estar finalizada para ser convertida em venda.'
      );
    }

    const result = await vendaService.processSale(
      os.customerName,
      os.items,
      paymentMethod,
      cashSessionId,
      os.customerId,
      userRole,
      true,
      `Convertido da OS #${os.osNumber}`
    );

    const { saleNumber, saleId } = result;

    const osRef = doc(db, 'serviceOrders', os.id!);

    await updateDoc(osRef, {
      status: 'entregue',
      convertedToSaleId: saleId,
      deliveredAt: serverTimestamp()
    });

    return { saleNumber, saleId };
  },

  getServiceOrders: (
    callback: (orders: ServiceOrder[]) => void
  ) => {
    const q = createScopedQuery(
      collection(db, 'serviceOrders'),
      limit(80)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs
          .map(
            doc =>
              ({
                id: doc.id,
                ...doc.data()
              } as ServiceOrder)
          )
          .sort((a, b) => {
            const tA = (a.timestamp as any)?.seconds || 0;
            const tB = (b.timestamp as any)?.seconds || 0;

            return tB - tA;
          });

        callback(orders);
      },
      (error) => {
        console.error(
          'Erro ao buscar ordens de serviço:',
          error
        );
      }
    );
  }
};
