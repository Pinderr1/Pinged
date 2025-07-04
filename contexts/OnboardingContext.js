import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View } from "react-native";
import Loader from "../components/Loader";
import { useAuth } from "./AuthContext";
import { clearStoredOnboarding } from "../utils/onboarding";
import Toast from "react-native-toast-message";

const OnboardingContext = createContext();


export const OnboardingProvider = ({ children }) => {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasOnboarded(false);
      setLoaded(true);
      return;
    }
    const key = `hasOnboarded_${user.uid}`;
    AsyncStorage.getItem(key)
      .then((val) => setHasOnboarded(val === "true"))
      .finally(() => setLoaded(true));
  }, [user]);

  const markOnboarded = async () => {
    if (!user) return;
    try {
      await AsyncStorage.setItem(`hasOnboarded_${user.uid}`, "true");
      setHasOnboarded(true);
    } catch (e) {
      console.warn("Failed to persist onboarding flag", e);
    }
  };

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
      Toast.show({ type: 'error', text1: 'Failed to clear onboarding' });
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
