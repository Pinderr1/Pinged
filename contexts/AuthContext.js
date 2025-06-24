import React, { createContext, useContext, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth, db, firebase } from '../firebase';

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
      const ref = db.collection('users').doc(fbUser.uid);
      const snap = await ref.get();
      if (!snap.exists) {
        await ref.set({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || '',
          photoURL: fbUser.photoURL || '',
          onboardingComplete: false,
          isPremium: false,
          dailyPlayCount: 0,
          lastGamePlayedAt: null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn('Failed to ensure user doc', e);
    }
  };

  const loginWithEmail = async (email, password) => {
    const userCred = await auth.signInWithEmailAndPassword(
      email.trim(),
      password,
    );
    await ensureUserDoc(userCred.user);
  };

  const signUpWithEmail = async (email, password) => {
    const userCred = await auth.createUserWithEmailAndPassword(
      email.trim(),
      password,
    );
    await db.collection('users').doc(userCred.user.uid).set({
      uid: userCred.user.uid,
      email: userCred.user.email,
      displayName: userCred.user.displayName || '',
      photoURL: userCred.user.photoURL || '',
      onboardingComplete: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  };

  const loginWithGoogle = () => promptAsync({ prompt: 'select_account' });

  const logout = () => auth.signOut();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (fbUser) => {
      setUser(fbUser);
      if (fbUser) await ensureUserDoc(fbUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = firebase.auth.GoogleAuthProvider.credential(id_token);
      auth
        .signInWithCredential(credential)
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
