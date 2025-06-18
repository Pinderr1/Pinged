import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth, db } from '../firebase';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID,
  });

  const ensureUserDoc = async (fbUser) => {
    try {
      const ref = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || '',
          photoURL: fbUser.photoURL || '',
          onboardingComplete: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('Failed to ensure user doc', e);
    }
  };

  const loginWithEmail = async (email, password) => {
    const userCred = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );
    await ensureUserDoc(userCred.user);
  };

  const signUpWithEmail = async (email, password) => {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );
    await setDoc(doc(db, 'users', userCred.user.uid), {
      uid: userCred.user.uid,
      email: userCred.user.email,
      displayName: userCred.user.displayName || '',
      photoURL: userCred.user.photoURL || '',
      onboardingComplete: false,
      createdAt: serverTimestamp(),
    });
  };

  const loginWithGoogle = () => promptAsync({ prompt: 'select_account' });

  const logout = () => signOut(auth);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) await ensureUserDoc(fbUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((res) => ensureUserDoc(res.user))
        .catch((err) => console.warn('Google login failed', err));
    }
  }, [response]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        signUpWithEmail,
        loginWithGoogle,
        logout,
        request,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
