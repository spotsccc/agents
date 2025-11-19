import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { environment } from './environment.js';

const serviceAccount: ServiceAccount = {
  projectId: environment.FIREBASE_PROJECT_ID,
  privateKey: environment.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: environment.FIREBASE_CLIENT_EMAIL,
};

export const firebaseApp = initializeApp({
  credential: cert(serviceAccount),
});

export const db = getFirestore(firebaseApp);