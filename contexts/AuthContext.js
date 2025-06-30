import React, { createContext, useContext, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firebase from "../firebase";
import { clearStoredOnboarding } from "./OnboardingContext";
import { snapshotExists } from "../utils/firestore";
import { isAllowedDomain } from "../utils/email";

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "pinged" });

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
    const userCred = await firebase
      .auth()
      .signInWithEmailAndPassword(email.trim(), password);
    await ensureUserDoc(userCred.user);
  };

  const signUpWithEmail = async (email, password) => {
    if (!isAllowedDomain(email)) {
      throw new Error("Email domain not supported");
    }
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
  };

  const loginWithGoogle = () =>
    promptAsync({ useProxy: false, prompt: "select_account" });

  const logout = async () => {
    if (user?.uid) await clearStoredOnboarding(user.uid);
    return firebase.auth().signOut();
  };

  useEffect(() => {
    const unsub = firebase.auth().onAuthStateChanged(async (fbUser) => {
      setUser(fbUser);
      if (fbUser) await ensureUserDoc(fbUser);
      setLoading(false);
    });
    return unsub;
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
