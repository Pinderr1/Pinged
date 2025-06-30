// firebase.js
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/functions';
import 'firebase/compat/database';

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

if (!firebase.apps.length) {
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.log('Firebase init error', e);
  }
}

const app = firebase.app();
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

export { app, auth, firestore, storage, functions, realtimeDB };
export default firebase;
