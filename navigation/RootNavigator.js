// navigation/RootNavigator.js
import React, { useEffect, useState } from 'react';
import { StatusBar, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useUser } from '../contexts/UserContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { logDev } from '../utils/logger';

import SplashScreen from '../screens/SplashScreen';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import OnboardingScreen from '../screens/OnboardingScreen';


const splashDuration = 2000;

export default function RootNavigator() {
  const [isSplash, setIsSplash] = useState(true);
  const { user, loading } = useUser();
  const { hasOnboarded } = useOnboarding();

  useEffect(() => {
    const timer = setTimeout(() => setIsSplash(false), splashDuration);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      const parsed = Linking.parse(url);
      if (parsed.path === 'chat') {
        logDev('Deep linking to Chat');
      }
    };
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  if (isSplash || loading) {
    return <SplashScreen onFinish={() => setIsSplash(false)} />;
  }

  // Prefer the onboarding flag from the user's profile. Only fall back to
  // the locally persisted flag when the profile has not been loaded yet.
  const onboarded =
    user?.onboardingComplete !== undefined
      ? user.onboardingComplete
      : hasOnboarded;

  if (!user) {
    return <AuthStack />;
  }

  if (!onboarded) {
    return <OnboardingScreen />;
  }

  return <AppStack />;
}
