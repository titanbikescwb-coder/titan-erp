import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  getDocs, 
  onSnapshot,
  increment,
  serverTimestamp,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Product, ServiceItem, ProductMovement } from '../domain/types';
import { createScopedQuery } from '../lib/firebaseUtils';

export const estoqueService = {
  getProducts: (callback: (products: Product[]) => void) => {
    const q = createScopedQuery(collection(db, 'products'), limit(300));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .sort((a, b) => (a.productCode || 0) - (b.productCode || 0));
      callback(products);
    }, (error) => {
      console.error("Erro ao buscar produtos:", error);
    });
  },

  addProduct: async (product: Omit<Product, 'id'>) => {
    const user = auth.currentUser;
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      userId: user?.uid || 'guest'
    });
    return docRef.id;
  },

  updateProduct: async (productId: string, data: Partial<Product>) => {
    await updateDoc(doc(db, 'products', productId), data);
  },

  deleteProduct: async (productId: string) => {
    await deleteDoc(doc(db, 'products', productId));
  },

  addManualMovement: async (
    productId: string, 
    productName: string,
    type: 'entrada' | 'saida' | 'ajuste', 
    quantity: number, 
    reason: string
  ) => {
    const user = auth.currentUser;

    const movement: Omit<ProductMovement, 'id'> = {
      productId,
      productName,
      type,
      quantity,
      reason,
      userId: user?.uid || 'guest',
      userName: user?.displayName || user?.email || 'Usuário Individual',
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'productMovements'), movement);
    
    // Update stock
    if (type === 'ajuste') {
      await updateDoc(doc(db, 'products', productId), {
        stock: quantity
      });
    } else {
      const stockChange = type === 'entrada' ? quantity : -quantity;
      await updateDoc(doc(db, 'products', productId), {
        stock: increment(stockChange)
      });
    }
  },

  getMovements: (productId: string | null, callback: (movements: ProductMovement[]) => void) => {
    let q;
    
    if (productId) {
      q = createScopedQuery(
        collection(db, 'productMovements'), 
        where('productId', '==', productId), 
        limit(50)
      );
    } else {
      q = createScopedQuery(
        collection(db, 'productMovements'), 
        limit(50)
      );
    }

    return onSnapshot(q, (snapshot) => {
      const movements = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ProductMovement))
        .sort((a, b) => {
          const tA = (a.timestamp as any)?.seconds || 0;
          const tB = (b.timestamp as any)?.seconds || 0;
          return tB - tA;
        });
      callback(movements);
    });
  },

  getServices: (callback: (services: ServiceItem[]) => void) => {
    const q = createScopedQuery(collection(db, 'serviceItems'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceItem));
      callback(services);
    }, (error) => {
      console.error("Erro ao buscar serviços:", error);
    });
  },

  addService: async (service: Omit<ServiceItem, 'id'>) => {
    const user = auth.currentUser;
    const docRef = await addDoc(collection(db, 'serviceItems'), {
      ...service,
      userId: user?.uid || 'guest'
    });
    return docRef.id;
  },

  // Helper to seed some data if empty
  seedData: async () => {
    const user = auth.currentUser;
    const userId = user?.uid || 'guest';
    
    const q = createScopedQuery(collection(db, 'products'), limit(1));
    const pSnap = await getDocs(q);
    
    if (pSnap.empty) {
      const products = [
        { name: 'Bicicleta Mountain Bike Aro 29', description: 'MTB Profissional', costPrice: 1500, price: 2500, stock: 5, minStock: 2, category: 'Bicicletas', sku: 'MTB-001', barcode: '789000000001', userId },
         { name: 'Capacete Profissional', description: 'Proteção máxima', costPrice: 80, price: 180, stock: 15, minStock: 5, category: 'Acessórios', sku: 'ACC-001', barcode: '789000000002', userId },
         { name: 'Câmara de Ar Aro 29', description: 'Resistente', costPrice: 15, price: 35, stock: 50, minStock: 10, category: 'Peças', sku: 'PAR-001', barcode: '789000000003', userId },
      ];
      for (const p of products) await addDoc(collection(db, 'products'), p);
    }
  }
};
