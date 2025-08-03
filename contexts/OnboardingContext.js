import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View } from "react-native";
import Loader from "../components/Loader";
import { useAuth } from "./AuthContext";
import { clearStoredOnboarding } from "../utils/onboarding";
import Toast from "react-native-toast-message";
import analytics from "../utils/analytics";
import firebase from "../firebase";

const OnboardingContext = createContext();

export const OnboardingProvider = ({ children }) => {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    let isMounted = true;
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
    return () => {
      isMounted = false;
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
        .update({ onboardingComplete: true });
      setHasOnboarded(true);
      await analytics.logEvent("onboarding_complete");
    } catch (e) {
      console.warn("Failed to persist onboarding flag", e);
    }
  };

  useEffect(() => {
    if (user?.uid && user.onboardingComplete) {
      markOnboarded();
    }
  }, [user?.uid, user?.onboardingComplete]);

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
