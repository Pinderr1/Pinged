// firebase.js (Firebase v8 compat)
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/functions';
import 'firebase/compat/database';

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

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  if (__DEV__) {
    console.log('Firebase config loaded', firebaseConfig);
  }
}

const auth = firebase.auth();
let firestore;
try {
  firestore = firebase.firestore();
} catch (e) {
  console.log('Firestore init error', e);
}
const storage = firebase.storage();
const functions = firebase.functions();
const realtimeDB = firebase.database();

export { auth, firestore, storage, functions, realtimeDB };
export default firebase;
