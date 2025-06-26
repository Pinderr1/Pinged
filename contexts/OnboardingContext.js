import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import Loader from '../components/Loader';

const OnboardingContext = createContext();
const STORAGE_KEY = 'hasOnboarded';

export const OnboardingProvider = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => setHasOnboarded(val === 'true'))
      .finally(() => setLoaded(true));
  }, []);

  const markOnboarded = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      setHasOnboarded(true);
    } catch (e) {
      console.warn('Failed to persist onboarding flag', e);
    }
  };

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loader />
      </View>
    );
  }

  return (
    <OnboardingContext.Provider value={{ hasOnboarded, markOnboarded }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => useContext(OnboardingContext);
