import { collection, getDocs, query, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

type BackupCollection =
  | 'products'
  | 'serviceItems'
  | 'sales'
  | 'serviceOrders'
  | 'financialEntries'
  | 'bankAccounts'
  | 'cashSessions'
  | 'cashMovements'
  | 'customers'
  | 'suppliers'
  | 'employees'
  | 'budgets'
  | 'settings'
  | 'fiscalNotes'
  | 'fiscalConfig';

const BACKUP_COLLECTIONS: BackupCollection[] = [
  'products',
  'serviceItems',
  'sales',
  'serviceOrders',
  'financialEntries',
  'bankAccounts',
  'cashSessions',
  'cashMovements',
  'customers',
  'suppliers',
  'employees',
  'budgets',
  'settings',
  'fiscalNotes',
  'fiscalConfig'
];

const convertFirestoreValue = (value: any): any => {
  if (!value) return value;

  if (value?.toDate && typeof value.toDate === 'function') {
    return {
      __type: 'timestamp',
      value: value.toDate().toISOString()
    };
  }

  if (Array.isArray(value)) {
    return value.map(convertFirestoreValue);
  }

  if (typeof value === 'object') {
    const converted: Record<string, any> = {};

    Object.entries(value).forEach(([key, val]) => {
      converted[key] = convertFirestoreValue(val);
    });

    return converted;
  }

  return value;
};

const downloadJsonFile = (data: any, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const backupService = {
  exportBackup: async () => {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('Usuário não autenticado. Faça login antes de exportar o backup.');
    }

    const backupData: Record<string, any[]> = {};

    for (const collectionName of BACKUP_COLLECTIONS) {
      const ref = collection(db, collectionName);
      const q = query(ref, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      backupData[collectionName] = snapshot.docs.map((document) => ({
        id: document.id,
        ...convertFirestoreValue(document.data())
      }));
    }

    const createdAt = new Date();

    const backup = {
      app: 'Titan ERP',
      version: '1.0',
      type: 'manual_export',
      userId: user.uid,
      userEmail: user.email,
      createdAt: createdAt.toISOString(),
      collections: BACKUP_COLLECTIONS,
      data: backupData
    };

    const date = createdAt.toISOString().slice(0, 10);
    const time = createdAt.toTimeString().slice(0, 8).replace(/:/g, '-');

    downloadJsonFile(backup, `titan-erp-backup-${date}-${time}.json`);

    try {
      await addDoc(collection(db, 'backupLogs'), {
        userId: user.uid,
        userEmail: user.email,
        type: 'manual_export',
        collections: BACKUP_COLLECTIONS,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.warn('Backup exportado, mas não foi possível registrar o log:', error);
    }

    return backup;
  },

  getBackupCollections: () => BACKUP_COLLECTIONS
};

export default backupService;
