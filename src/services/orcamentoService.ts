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
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Budget, SaleItem, ServiceOrder } from '../domain/types';
import { logger } from './logService';
import { vendaService } from './vendaService';
import { ordemServicoService } from './ordemServicoService';
import { createScopedQuery } from '../lib/firebaseUtils';

export const orcamentoService = {
  // Get next budget number
  getNextBudgetNumber: async () => {
    const q = createScopedQuery(
      collection(db, 'budgets')
    );
    const snap = await getDocs(q);
    if (snap.empty) return 1;
    const budgets = snap.docs.map(doc => doc.data() as Budget);
    const maxNumber = Math.max(...budgets.map(b => b.budgetNumber || 0));
    return maxNumber + 1;
  },

  // Create a new budget
  createBudget: async (
    customerName: string, 
    items: SaleItem[], 
    validityDays: number = 7,
    customerId?: string
  ) => {
    const user = auth.currentUser;
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const budgetNumber = await orcamentoService.getNextBudgetNumber();
    
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);
 
    const budgetData: Omit<Budget, 'id'> = {
      budgetNumber,
      userId: user?.uid || 'guest',
      userName: user?.displayName || user?.email || 'Usuário Individual',
      customerId,
      customerName,
      items,
      totalAmount,
      status: 'aberto',
      validUntil: validUntil,
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'budgets'), budgetData);
    await logger.log('Orçamento Criado', 'Orçamentos', `Orçamento #${budgetNumber} - Cliente: ${customerName}`);
    return budgetNumber;
  },

  // Update budget status
  updateStatus: async (budgetId: string, status: Budget['status']) => {
    await updateDoc(doc(db, 'budgets', budgetId), { status });
    await logger.log('Status de Orçamento Alterado', 'Orçamentos', `ID: ${budgetId} -> ${status}`);
  },

  // Convert budget to sale
  convertToSale: async (budget: Budget, paymentMethod: any, cashSessionId: string, userRole: string) => {
    // 1. Process the sale using existing vendaService logic
    // We force it to be PENDING so it appears in the cashier
    const result = await vendaService.processSale(
      budget.customerName,
      budget.items,
      paymentMethod,
      cashSessionId,
      budget.customerId,
      userRole,
      true, // forcePending = true
      `Convertido do Orçamento #${budget.budgetNumber}`
    );
    
    const { saleNumber, saleId } = result;

    // 2. Update budget status to converted
    await updateDoc(doc(db, 'budgets', budget.id!), { 
      status: 'convertido',
      convertedToId: saleNumber.toString(), // We use saleNumber as reference
      convertedToSaleId: saleId, // Store the actual sale ID
      convertedType: 'venda'
    });

    await logger.log('Orçamento Convertido', 'Orçamentos', `Orçamento #${budget.budgetNumber} convertido em Venda #${saleNumber}`);
    return { saleNumber, saleId };
  },

  // Convert budget to Service Order (OS)
  convertToOS: async (budget: Budget, bikeDetails: string, problemDescription: string) => {
    const user = auth.currentUser;
    const nextOSNumber = await ordemServicoService.getNextOSNumber();
 
    const osData: Omit<ServiceOrder, 'id'> = {
      osNumber: nextOSNumber,
      userId: user?.uid || 'guest',
      userName: user?.displayName || user?.email || 'Usuário Individual',
      customerId: budget.customerId,
      customerName: budget.customerName,
      bikeDetails,
      problemDescription,
      entryDate: new Date().toISOString().split('T')[0],
      items: budget.items,
      totalAmount: budget.totalAmount,
      status: 'aberto',
      timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'serviceOrders'), osData);

    // Update budget status
    await updateDoc(doc(db, 'budgets', budget.id!), { 
      status: 'convertido',
      convertedToId: nextOSNumber.toString(),
      convertedType: 'servico'
    });

    await logger.log('Orçamento Convertido', 'Orçamentos', `Orçamento #${budget.budgetNumber} convertido em OS #${nextOSNumber}`);
    return nextOSNumber;
  },

  // Listen to budgets
  getBudgets: (callback: (budgets: Budget[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'budgets'), 
      limit(200)
    );
    return onSnapshot(q, (snapshot) => {
      const budgets = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Budget))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
      callback(budgets);
    });
  }
};
