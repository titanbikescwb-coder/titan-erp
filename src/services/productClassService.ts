import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  runTransaction,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ProductClass, DEFAULT_PRODUCT_CLASSES } from '../domain/productClass';

export const productClassService = {
  seedClasses: async () => {
    const classesRef = collection(db, 'classes_produtos');
    
    for (const item of DEFAULT_PRODUCT_CLASSES) {
      // Use a slugified name as ID to prevent duplicates
      const slugId = item.nome.toLowerCase()
        .replace(/[áàâã]/g, 'a')
        .replace(/[éèê]/g, 'e')
        .replace(/[íìî]/g, 'i')
        .replace(/[óòôõ]/g, 'o')
        .replace(/[úùû]/g, 'u')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '_');
      
      const classDocRef = doc(db, 'classes_produtos', slugId);
      
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(classDocRef);
        if (!docSnap.exists()) {
          // If the fixed ID doesn't exist, create it
          transaction.set(classDocRef, {
            ...item,
            ultimoCodigo: item.codigoInicial - 1
          });
        }
      });
    }
  },

  getClasses: async (): Promise<ProductClass[]> => {
    const classesRef = collection(db, 'classes_produtos');
    const q = query(classesRef, orderBy('nome', 'asc'));
    const snapshot = await getDocs(q);
    
    const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductClass));
    
    // Deduplicate by name in case there are records with different IDs but same name
    const seenNames = new Set();
    return allDocs.filter(c => {
      if (seenNames.has(c.nome)) {
        return false;
      }
      seenNames.add(c.nome);
      return true;
    });
  },

  generateProductCode: async (classId: string): Promise<number> => {
    const classDocRef = doc(db, 'classes_produtos', classId);

    return await runTransaction(db, async (transaction) => {
      const classDoc = await transaction.get(classDocRef);
      if (!classDoc.exists()) {
        throw new Error('Classe de produto não encontrada no banco de dados.');
      }

      const data = classDoc.data() as ProductClass;
      // Use the actual stored ultimoCodigo, or fall back to start - 1
      const currentLastCode = typeof data.ultimoCodigo === 'number' ? data.ultimoCodigo : (data.codigoInicial - 1);
      const nextCode = currentLastCode + 1;

      if (nextCode > data.codigoFinal) {
        throw new Error(`Limite de códigos atingido para a classe "${data.nome}" (${data.codigoFinal}).`);
      }

      // Update the sequence
      transaction.update(classDocRef, { ultimoCodigo: nextCode });
      
      console.log(`Generated code ${nextCode} for class ${data.nome}`);
      return nextCode;
    });
  },

  syncLastCode: async (classId: string, manualCode: number) => {
    const classDocRef = doc(db, 'classes_produtos', classId);
    await runTransaction(db, async (transaction) => {
      const classDoc = await transaction.get(classDocRef);
      if (classDoc.exists()) {
        const data = classDoc.data() as ProductClass;
        // Only update if manual code is within range and higher than currently tracked last
        if (manualCode > (data.ultimoCodigo ?? (data.codigoInicial - 1)) && 
            manualCode <= data.codigoFinal && 
            manualCode >= data.codigoInicial) {
          transaction.update(classDocRef, { ultimoCodigo: manualCode });
          console.log(`Synced ultimoCodigo to ${manualCode} for class ${data.nome}`);
        }
      }
    });
  }
};
