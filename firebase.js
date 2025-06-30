// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (__DEV__) {
  console.log('Firebase config loaded', firebaseConfig);
}

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.log('Firebase init error', e);
}

const auth = getAuth(app);
let firestore;
try {
  firestore = getFirestore(app);
} catch (e) {
  console.log('Firestore init error', e);
}
const storage = getStorage(app);
const functions = getFunctions(app);
const realtimeDB = getDatabase(app);

export { app, auth, firestore, storage, functions, realtimeDB };
