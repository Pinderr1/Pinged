import React, { createContext, useContext, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firebase from "../firebase";
import Toast from "react-native-toast-message";
import { clearStoredOnboarding } from "../utils/onboarding";
import { snapshotExists } from "../utils/firestore";
import { isAllowedDomain } from "../utils/email";
import { initPresence } from "../utils/presence";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "pinged" });

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID,
    redirectUri,
  });

  const ensureUserDoc = async (fbUser) => {
    try {
      const ref = firebase.firestore().collection("users").doc(fbUser.uid);
      const snap = await ref.get();
      if (!snapshotExists(snap)) {
        await ref.set({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || "",
          photoURL: fbUser.photoURL || "",
          onboardingComplete: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      console.warn("Failed to ensure user doc", e);
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const userCred = await firebase
        .auth()
        .signInWithEmailAndPassword(email.trim(), password);
      await ensureUserDoc(userCred.user);
    } catch (e) {
      console.warn("Login failed", e);
      Toast.show({ type: "error", text1: "Login failed" });
      throw e;
    }
  };

  const signUpWithEmail = async (email, password) => {
    if (!isAllowedDomain(email)) {
      throw new Error("Email domain not supported");
    }
    try {
      const userCred = await firebase
        .auth()
        .createUserWithEmailAndPassword(email.trim(), password);
      try {
        const keys = await AsyncStorage.getAllKeys();
        const matchKeys = keys.filter((k) => k.startsWith("chatMatches"));
        if (matchKeys.length) await AsyncStorage.multiRemove(matchKeys);
      } catch (e) {
        console.warn("Failed to clear stored matches", e);
      }
      await firebase
        .firestore()
        .collection("users")
        .doc(userCred.user.uid)
        .set({
          uid: userCred.user.uid,
          email: userCred.user.email,
          displayName: userCred.user.displayName || "",
          photoURL: userCred.user.photoURL || "",
          onboardingComplete: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    } catch (e) {
      console.warn("Signup failed", e);
      Toast.show({ type: "error", text1: "Signup failed" });
      throw e;
    }
  };

  const loginWithGoogle = () =>
    promptAsync({ useProxy: false, prompt: "select_account" });

  const logout = async () => {
    try {
      if (user?.uid) await clearStoredOnboarding(user.uid);
      await firebase.auth().signOut();
    } catch (e) {
      console.warn("Logout failed", e);
      Toast.show({ type: "error", text1: "Logout failed" });
    }
  };

  useEffect(() => {
    let unsubProfile;
    let presenceCleanup;
    let currentUid = null;
    const unsub = firebase.auth().onAuthStateChanged(async (fbUser) => {
      if (fbUser?.uid !== currentUid) {
        if (!fbUser && currentUid) clearStoredOnboarding(currentUid);
        currentUid = fbUser?.uid || null;
      }

      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      if (presenceCleanup) {
        presenceCleanup();
        presenceCleanup = null;
      }

      if (fbUser) {
        setLoading(true);
        await ensureUserDoc(fbUser);
        presenceCleanup = await initPresence(fbUser.uid);
        try {
          await firebase.functions().httpsCallable('refreshPremiumStatus')();
        } catch (e) {
          console.warn('Failed to refresh premium status', e);
        }
        const ref = firebase.firestore().collection("users").doc(fbUser.uid);
        unsubProfile = ref.onSnapshot(
          (snap) => {
            if (snapshotExists(snap)) {
              const data = snap.data();
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                isPremium: !!data.isPremium,
                badges: data.badges || [],
                unlocks: data.unlocks || [],
                eventTickets: data.eventTickets || [],
                ...data,
              });
            } else {
              setUser({
                uid: fbUser.uid,
                email: fbUser.email,
                isPremium: false,
                unlocks: [],
                eventTickets: [],
              });
            }
            setLoading(false);
          },
          (err) => {
            console.warn("Failed to subscribe user doc", err);
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              isPremium: false,
              eventTickets: [],
            });
            setLoading(false);
          },
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => {
      unsub();
      if (unsubProfile) unsubProfile();
      if (presenceCleanup) presenceCleanup();
    };
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = firebase.auth.GoogleAuthProvider.credential(id_token);
      firebase
        .auth()
        .signInWithCredential(credential)
        .then((res) => ensureUserDoc(res.user))
        .catch((err) => console.warn("Google login failed", err));
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
