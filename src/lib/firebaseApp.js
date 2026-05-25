import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { initializeFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCZooFoR2dYEa0-pnTzaVykWMi_f5iYjx0',
  authDomain: 'learningapp-5cad1.firebaseapp.com',
  projectId: 'learningapp-5cad1',
  storageBucket: 'learningapp-5cad1.firebasestorage.app',
  messagingSenderId: '774920369319',
  appId: '1:774920369319:web:617727d38d9c61e44a9782',
  measurementId: 'G-65WM600N0L',
};

export const QUESTION_SETS_COLLECTION = 'questionSets';

export const firebaseApp = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];

export const firebaseAuth = getAuth(firebaseApp);

export const googleProvider = new GoogleAuthProvider();

export const firestoreDb = initializeFirestore(firebaseApp, {
  ignoreUndefinedProperties: true,
});

