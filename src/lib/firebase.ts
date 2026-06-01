import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD8rulRzQOJrRJTUhyKQarMH8fE94ULq3I',
  authDomain: 'studio-5531257700-ece4c.firebaseapp.com',
  projectId: 'studio-5531257700-ece4c',
  storageBucket: 'studio-5531257700-ece4c.firebasestorage.app',
  messagingSenderId: '1067709544349',
  appId: '1:1067709544349:web:114e7fc5f56979fef02174',
};

const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export default app;
