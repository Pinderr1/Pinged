// firebase.js (Firebase modular API)
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  serverTimestamp,
  arrayUnion,
  deleteField,
  increment,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getDatabase } from 'firebase/database';

// Validate required environment variables at runtime
const requiredEnv = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required env var: ${key}`);
  }
});

const optionalEnv = [
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_CHECKOUT_FUNCTION',
];

optionalEnv.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`Optional env var not set: ${key}`);
  }
});

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const auth = getAuth(app);
let firestore;
try {
  firestore = getFirestore(app);
} catch (e) {
  console.error('Firestore init error', e);
}
const storage = getStorage(app);
const functions = getFunctions(app);
const realtimeDB = getDatabase(app);

const FieldValue = {
  serverTimestamp,
  arrayUnion,
  delete: deleteField,
  increment,
};

const firebase = {
  apps: [app],
  initializeApp: () => app,
};

firebase.auth = () => auth;
firebase.firestore = Object.assign(() => firestore, { FieldValue });
firebase.storage = () => storage;
firebase.functions = () => functions;
firebase.database = () => realtimeDB;

export { auth, firestore, storage, functions, realtimeDB };
export default firebase;
