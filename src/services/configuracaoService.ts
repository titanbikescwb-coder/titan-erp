import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { CompanySettings } from '../domain/types';
import { logger } from './logService';

export const configuracaoService = {
  getSettings: (callback: (settings: CompanySettings | null) => void) => {
    const docRef = doc(db, 'settings', 'global');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as CompanySettings);
      } else {
        callback(null);
      }
    });
  },

  saveSettings: async (settings: Omit<CompanySettings, 'id' | 'updatedAt'>) => {
    const docRef = doc(db, 'settings', 'global');
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    await logger.log('Configurações Atualizadas', 'Configurações', 'Dados da empresa e parâmetros do sistema atualizados');
  }
};
