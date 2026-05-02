import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export const logger = {
  log: async (action: string, module: string, details?: string) => {
    const user = auth.currentUser;
    try {
      await addDoc(collection(db, 'logs'), {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        action,
        module,
        timestamp: serverTimestamp(),
        details: details || ''
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }
};
