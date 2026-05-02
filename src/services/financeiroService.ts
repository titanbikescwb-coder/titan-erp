import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  onSnapshot,
  serverTimestamp,
  orderBy,
  getDocs,
  Timestamp,
  where,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { FinancialEntry, FinancialStatus, BankAccount } from '../domain/types';
import { logger } from './logService';
import { createScopedQuery } from '../lib/firebaseUtils';

export const financeiroService = {
  getEntries: (callback: (entries: FinancialEntry[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'financialEntries'),
      limit(500)
    );
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialEntry));
      // Sort in memory to avoid index requirement
      entries.sort((a, b) => {
        const tA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
        const tB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
        return tB - tA;
      });
      callback(entries);
    }, (error) => {
      console.error("Erro ao buscar lançamentos financeiros (Index missing?):", error);
    });
  },

  getEntriesByDateRange: (start: Date, end: Date, callback: (entries: FinancialEntry[]) => void) => {
    const startTs = start.getTime();
    const endTs = end.getTime() + (24 * 60 * 60 * 1000) - 1;

    const q = createScopedQuery(
      collection(db, 'financialEntries'), 
      limit(1000)
    );
    return onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as FinancialEntry))
        .filter(entry => {
          if (!entry.date) return false;
          const date = entry.date.toDate ? entry.date.toDate() : new Date(entry.date);
          const ts = date.getTime();
          return ts >= startTs && ts <= endTs;
        });

      // Sort in memory to avoid index requirement
      entries.sort((a, b) => {
        const tA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
        const tB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
        return tB - tA;
      });
      
      callback(entries);
    }, (error) => {
      console.error("Erro ao buscar lançamentos financeiros por intervalo:", error);
    });
  },

  addEntry: async (entry: Omit<FinancialEntry, 'id' | 'date' | 'userId'>) => {
    const user = auth.currentUser;

    const docRef = await addDoc(collection(db, 'financialEntries'), {
      ...entry,
      date: serverTimestamp(),
      userId: user?.uid || 'guest'
    });
    await logger.log('Lançamento Financeiro', 'Financeiro', `${entry.type.toUpperCase()}: ${entry.description} - R$ ${entry.amount}`);
    return docRef.id;
  },

  updateEntryStatus: async (entryId: string, status: FinancialStatus, paymentDate?: any) => {
    const updateData: any = { status };
    if (status === 'pago') {
      updateData.paymentDate = paymentDate || serverTimestamp();
    }
    await updateDoc(doc(db, 'financialEntries', entryId), updateData);
    await logger.log('Status Financeiro Alterado', 'Financeiro', `ID: ${entryId} -> ${status}`);
  },

  deleteEntry: async (entryId: string) => {
    await deleteDoc(doc(db, 'financialEntries', entryId));
    await logger.log('Lançamento Financeiro Excluído', 'Financeiro', `ID: ${entryId}`);
  },

  // Bank Accounts
  getAccounts: (callback: (accounts: BankAccount[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'bankAccounts')
    );
    return onSnapshot(q, (snapshot) => {
      const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      // Sort in memory
      accounts.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      callback(accounts);
    }, (error) => {
      console.error("Erro ao buscar contas bancárias:", error);
    });
  },

  addAccount: async (account: Omit<BankAccount, 'id' | 'createdAt' | 'currentBalance'>) => {
    const user = auth.currentUser;
    const docRef = await addDoc(collection(db, 'bankAccounts'), {
      ...account,
      userId: user?.uid || 'guest',
      currentBalance: account.initialBalance,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  },

  updateAccountBalance: async (accountId: string, amount: number, type: 'receita' | 'despesa') => {
    const accountRef = doc(db, 'bankAccounts', accountId);
    // Note: In a real app we'd use a transaction for consistency
    // But for this simplified version we'll just update
    const snap = await getDocs(createScopedQuery(collection(db, 'bankAccounts'), where('__name__', '==', accountId)));
    if (snap.empty) return;
    const account = snap.docs[0].data() as BankAccount;
    const newBalance = type === 'receita' ? account.currentBalance + amount : account.currentBalance - amount;
    await updateDoc(accountRef, { currentBalance: newBalance });
  },

  // Logic for Cash Flow
  getCashFlowData: async (days: number = 30) => {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);
    const startTs = startDate.getTime();

    const q = createScopedQuery(
      collection(db, 'financialEntries'), 
      limit(1000)
    );

    const snap = await getDocs(q);
    const entries = snap.docs
      .map(doc => doc.data() as FinancialEntry)
      .filter(entry => {
        if (!entry.date) return false;
        const date = entry.date.toDate ? entry.date.toDate() : new Date(entry.date);
        return date.getTime() >= startTs;
      })
      .sort((a, b) => {
        const tA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
        const tB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
        return tA - tB;
      });

    // Group by date and calculate balance
    const flow: { date: string, receita: number, despesa: number, saldo: number }[] = [];
    const dailyMap = new Map<string, { receita: number, despesa: number }>();

    entries.forEach(entry => {
      const dateStr = entry.date?.toDate ? entry.date.toDate().toLocaleDateString() : new Date(entry.date).toLocaleDateString();
      const current = dailyMap.get(dateStr) || { receita: 0, despesa: 0 };
      
      if (entry.type === 'receita') current.receita += entry.amount;
      else current.despesa += entry.amount;
      
      dailyMap.set(dateStr, current);
    });

    let runningBalance = 0;
    dailyMap.forEach((val, key) => {
      runningBalance += (val.receita - val.despesa);
      flow.push({
        date: key,
        receita: val.receita,
        despesa: val.despesa,
        saldo: runningBalance
      });
    });

    return flow;
  }
};
