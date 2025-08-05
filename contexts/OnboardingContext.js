import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View } from "react-native";
import Loader from "../components/Loader";
import { useAuth } from "./AuthContext";
import { clearStoredOnboarding } from "../utils/onboarding";
import Toast from "react-native-toast-message";
import * as Analytics from "../utils/analytics";
import firebase from "../firebase";

const OnboardingContext = createContext();

export const OnboardingProvider = ({ children }) => {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    if (!user) {
      if (isMounted) {
        setHasOnboarded(false);
        setLoaded(true);
      }
      return () => {
        isMounted = false;
      };
    }

    const key = `hasOnboarded_${user.uid}`;
    AsyncStorage.getItem(key)
      .then((val) => {
        if (isMounted) setHasOnboarded(val === "true");
      })
      .finally(() => {
        if (isMounted) setLoaded(true);
      });

    unsubscribe = firebase
      .firestore()
      .collection("users")
      .doc(user.uid)
      .onSnapshot(
        (snap) => {
          const data = snap.data() || {};
          if (isMounted) setHasOnboarded(!!data.onboardingCompleted);
        },
        (err) => {
          console.warn("Failed to subscribe onboarding status", err);
        }
      );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user]);

  const markOnboarded = async () => {
    if (!user) return;
    try {
      await AsyncStorage.setItem(`hasOnboarded_${user.uid}`, "true");
      await firebase
        .firestore()
        .collection("users")
        .doc(user.uid)
        .update({ onboardingCompleted: true });
      setHasOnboarded(true);
      await Analytics.logEvent("onboarding_complete");
    } catch (e) {
      console.warn("Failed to persist onboarding flag", e);
    }
  };

  useEffect(() => {
    if (user?.uid && user.onboardingCompleted) {
      markOnboarded();
    }
  }, [user?.uid, user?.onboardingCompleted]);

  const clearOnboarding = async () => {
    if (!user) {
      setHasOnboarded(false);
      return;
    }
    try {
      await clearStoredOnboarding(user.uid);
      setHasOnboarded(false);
    } catch (e) {
      console.warn("Failed to clear onboarding", e);
      Toast.show({ type: "error", text1: "Failed to clear onboarding" });
    }
  };

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Loader />
      </View>
    );
  }

  return (
    <OnboardingContext.Provider
      value={{ hasOnboarded, markOnboarded, clearOnboarding }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);
