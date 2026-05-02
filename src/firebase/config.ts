import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCMiGsoqGaHXhUCq5INWItg-JI4egjU3nQ",
  authDomain: "titan-erp-98180.firebaseapp.com",
  projectId: "titan-erp-98180",
  storageBucket: "titan-erp-98180.firebasestorage.app",
  messagingSenderId: "384471238813",
  appId: "1:384471238813:web:7c7094a9828e312e832c74"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);