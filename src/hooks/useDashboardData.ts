import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createScopedQuery } from '../lib/firebaseUtils';
import { Sale, ServiceOrder, Budget, FinancialEntry, BankAccount } from '../domain/types';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const startTs = startOfDay.getTime();
        const monthTs = startOfMonth.getTime();

        const salesQuery = createScopedQuery(
          collection(db, 'sales'),
          limit(300) // Fetch enough for dashboard stats
        );
        
        const snap = await getDocs(salesQuery);
        const allSales = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Sale))
          .sort((a, b) => {
            const tA = (a.timestamp as any)?.seconds || 0;
            const tB = (b.timestamp as any)?.seconds || 0;
            return tB - tA;
          });

        const todaySales = allSales.filter(s => {
          if (!s.timestamp) return false;
          const date = s.timestamp.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
          return date.getTime() >= startTs;
        });

        const monthSales = allSales.filter(s => {
          if (!s.timestamp) return false;
          const date = s.timestamp.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
          return date.getTime() >= monthTs;
        });

        const todayTotal = todaySales.reduce((acc, s) => acc + s.totalAmount, 0);
        const monthTotal = monthSales.reduce((acc, s) => acc + s.totalAmount, 0);

        const monthServiceTotal = monthSales.reduce((acc, s) => 
          acc + (s.items || []).filter(i => i.type === 'service').reduce((a, it) => a + it.totalPrice, 0), 0);

        return {
          todayTotal,
          monthTotal,
          monthServiceTotal,
          todaySales,
          monthSales,
          todayCount: todaySales.length,
          monthCount: monthSales.length
        };
      } catch (error) {
        console.error("Erro ao carregar estatísticas do dashboard:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useActiveOrders() {
  return useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      try {
        const q = createScopedQuery(
          collection(db, 'serviceOrders'),
          where('status', 'in', ['aberto', 'em_andamento', 'aguardando_pecas'])
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceOrder));
      } catch (error) {
        console.error("Erro ao carregar ordens ativas:", error);
        throw error;
      }
    }
  });
}
