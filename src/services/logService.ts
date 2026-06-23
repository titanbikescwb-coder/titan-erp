import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export const logger = {
  log: async (
    action: string,
    module: string,
    details?: string,
    metadata?: any
  ) => {
    const user = auth.currentUser;

    try {
      await addDoc(collection(db, 'logs'), {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        userName: user?.displayName || 'Operador',

        action,
        module,
        details: details || '',

        metadata: metadata || {},

        createdAt: serverTimestamp(),

        deviceInfo: navigator.userAgent,
        platform: navigator.platform,

        sessionType: user ? 'authenticated' : 'anonymous'
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }
};