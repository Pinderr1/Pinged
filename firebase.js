// firebase.js (Firebase modular API)
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  serverTimestamp,
  arrayUnion,
  deleteField,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { initCrashlytics } from './utils/crashlytics';

// Validate required environment variables at runtime
const requiredEnv = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID',
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  const message = `Missing required env var(s): ${missingEnv.join(', ')}`;
  console.error(message);
  throw new Error(message);
}

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

// Initialize Crashlytics (no-op on unsupported platforms)
initCrashlytics();

const auth = getAuth(app);
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const authEmulatorUrl = `http://${authEmulatorHost}`;
  connectAuthEmulator(auth, authEmulatorUrl);
}

let firestore;
try {
  firestore = getFirestore(app);
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
    connectFirestoreEmulator(firestore, host, Number(port));
  }
} catch (e) {
  console.error('Firestore init error', e);
}
const storage = getStorage(app);
const functions = getFunctions(app);
if (process.env.FUNCTIONS_EMULATOR_HOST) {
  const [host, port] = process.env.FUNCTIONS_EMULATOR_HOST.split(':');
  connectFunctionsEmulator(functions, host, Number(port));
}
const realtimeDB = getDatabase(app);
if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
  const [host, port] = process.env.FIREBASE_DATABASE_EMULATOR_HOST.split(':');
  connectDatabaseEmulator(realtimeDB, host, Number(port));
}

const FieldValue = {
  serverTimestamp,
  arrayUnion,
  delete: deleteField,
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
