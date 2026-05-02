import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estoqueService } from '../services/estoqueService';
import { servicoService } from '../services/servicoService';
import { Product, ServiceItem } from '../domain/types';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // In a real scenario, we'd use a promise-based getter
      // For now, we'll convert the existing listener approach if possible or use a one-time get
      return new Promise<Product[]>((resolve) => {
        const unsub = estoqueService.getProducts((products) => {
          resolve(products);
          unsub(); // Get once for the query
        });
      });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      return new Promise<ServiceItem[]>((resolve) => {
        const unsub = servicoService.getServices((services) => {
          resolve(services);
          unsub();
        });
      });
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useMovements(productId: string | null = null) {
  return useQuery({
    queryKey: ['movements', productId],
    queryFn: async () => {
      return new Promise<any[]>((resolve) => {
        const unsub = estoqueService.getMovements(productId, (movements) => {
          resolve(movements);
          unsub();
        });
      });
    },
  });
}
