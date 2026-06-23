import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  where,
  limit,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { UserProfile } from '../domain/types';
import { logger } from './logService';
import { createScopedQuery } from '../lib/firebaseUtils';

export const userService = {
  // Get users in the current tenant
  getUsers: (callback: (users: UserProfile[]) => void) => {
    const q = createScopedQuery(collection(db, 'users'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({ ...doc.data() } as UserProfile))
        .sort((a, b) => (a.email || '').localeCompare(b.email || ''));
      callback(users);
    });
  },

  // Get or create user profile
  getOrCreateProfile: async (user: { uid: string, email: string | null, displayName: string | null }) => {
    const docRef = doc(db, 'users', user.uid);
    let docSnap;
    
    try {
      docSnap = await getDoc(docRef);
    } catch (error: any) {
      console.warn("Erro ao buscar perfil:", error.message);
      return null;
    }

    if (docSnap && docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }

    // Default profile
    const newProfile: UserProfile = {
      uid: user.uid,
      name: user.displayName || 'Usuário',
      email: user.email || '',
      active: true,
      isAdmin: user.email === 'titanbikescwb@gmail.com',
permissions: user.email === 'titanbikescwb@gmail.com'
  ? [
      'dashboard',
      'caixa',
      'vendas',
      'orcamentos',
      'servicos',
      'estoque',
      'cadastros',
      'financeiro',
      'agenda',
      'fiscal',
      'relatorios',
      'configuracoes'
    ]
  : [],
      createdAt: serverTimestamp()
    };

    await setDoc(docRef, newProfile);
    return newProfile;
  },

  // Listen to current user profile
  subscribeToProfile: (uid: string, callback: (profile: UserProfile | null) => void) => {
    const docRef = doc(db, 'users', uid);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserProfile);
      } else {
        callback(null);
      }
    });
  },

  updateProfile: async (uid: string, data: Partial<UserProfile>) => {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
    await logger.log('Perfil Atualizado', 'Sistema', `UID: ${uid}`);
  }
};
