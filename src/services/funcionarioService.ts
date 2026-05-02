import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Employee, UserProfile } from '../domain/types';
import { logger } from './logService';
import { createScopedQuery } from '../lib/firebaseUtils';
import { userService } from './userService';

export const funcionarioService = {
  getEmployees: (callback: (employees: Employee[]) => void) => {
    const q = createScopedQuery(
      collection(db, 'employees')
    );
    return onSnapshot(q, (snapshot) => {
      const employees = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Employee))
        .sort((a, b) => a.name.localeCompare(b.name));
      callback(employees);
    });
  },

  addEmployee: async (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    // Force active if admin
    const finalData = {
      ...employee,
      userId: auth.currentUser?.uid || 'guest',
      active: employee.isAdmin ? true : employee.active,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'employees'), finalData);
    
    // Attempt to sync with existing user profile
    await funcionarioService.syncToUserProfile(employee.email, finalData);

    await logger.log('Funcionário Cadastrado', 'Cadastros', `Funcionário: ${employee.name}`);
    return docRef.id;
  },

  updateEmployee: async (employeeId: string, data: Partial<Employee>) => {
    // If becoming admin, force active
    const updateData = { ...data };
    if (updateData.isAdmin === true) {
      updateData.active = true;
    }

    await updateDoc(doc(db, 'employees', employeeId), updateData);

    // Sync to user profile if exists
    if (data.email || updateData.isAdmin !== undefined || updateData.permissions !== undefined || updateData.active !== undefined) {
      // We search by email to find the linked auth user
      const emailToSearch = data.email || (await (await getDocs(query(collection(db, 'employees'), where('__name__', '==', employeeId)))).docs[0].data()).email;
      await funcionarioService.syncToUserProfile(emailToSearch, updateData);
    }

    await logger.log('Funcionário Atualizado', 'Cadastros', `ID: ${employeeId}`);
  },

  syncToUserProfile: async (email: string, data: Partial<Employee>) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const syncData: Partial<UserProfile> = {};
        
        if (data.isAdmin !== undefined) syncData.isAdmin = data.isAdmin;
        if (data.permissions !== undefined) syncData.permissions = data.permissions;
        if (data.active !== undefined) syncData.active = data.active;
        if (data.name) syncData.name = data.name;
        
        // Ensure admin is never blocked in profile too
        if (syncData.isAdmin === true) syncData.active = true;
        
        if (Object.keys(syncData).length > 0) {
          await userService.updateProfile(userDoc.id, syncData);
        }
      }
    } catch (error) {
      console.error("Erro ao sincronizar com UserProfile:", error);
    }
  },

  deleteEmployee: async (employeeId: string) => {
    await deleteDoc(doc(db, 'employees', employeeId));
    await logger.log('Funcionário Excluído', 'Cadastros', `ID: ${employeeId}`);
  }
};
