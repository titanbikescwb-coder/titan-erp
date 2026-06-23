import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';
import { db } from '../firebase/config';
import { createScopedQuery } from '../lib/firebaseUtils';
import { Sale, ServiceOrder, Budget, FinancialEntry, BankAccount } from '../domain/types';

export interface DashboardStats {
  todayTotal: number;
  monthTotal: number;
  monthServiceTotal: number;
  todaySales: Sale[];
  monthSales: Sale[];
  todayCount: number;
  monthCount: number;
}

export function useDashboardStats() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const q = createScopedQuery(
      collection(db, 'sales'),
      limit(1000)
    );

    const unsub = onSnapshot(q, (snap) => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startTs = startOfDay.getTime();
      const monthTs = startOfMonth.getTime();

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

      queryClient.setQueryData(['dashboard-stats'], {
        todayTotal,
        monthTotal,
        monthServiceTotal,
        todaySales,
        monthSales,
        todayCount: todaySales.length,
        monthCount: monthSales.length
      });
    }, (error) => {
      console.error("Erro em useDashboardStats onSnapshot:", error);
    });

    return () => unsub();
  }, [queryClient]);

  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const queryData = queryClient.getQueryData<DashboardStats>(['dashboard-stats']);
      if (queryData) return queryData;

      const q = createScopedQuery(collection(db, 'sales'), limit(1000));
      const snap = await getDocs(q);
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startTs = startOfDay.getTime();
      const monthTs = startOfMonth.getTime();

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
    },
    staleTime: Infinity,
  });
}

export function useActiveOrders() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const q = createScopedQuery(
      collection(db, 'serviceOrders'),
      where('status', 'in', ['aberto', 'em_andamento', 'aguardando_pecas'])
    );

    const unsub = onSnapshot(q, (snap) => {
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceOrder));
      queryClient.setQueryData(['active-orders'], orders);
    });

    return () => unsub();
  }, [queryClient]);

  return useQuery<ServiceOrder[]>({
    queryKey: ['active-orders'],
    queryFn: async (): Promise<ServiceOrder[]> => {
      const queryData = queryClient.getQueryData<ServiceOrder[]>(['active-orders']);
      if (queryData) return queryData;

      const q = createScopedQuery(
        collection(db, 'serviceOrders'),
        where('status', 'in', ['aberto', 'em_andamento', 'aguardando_pecas'])
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceOrder));
    },
    staleTime: Infinity,
  });
}
