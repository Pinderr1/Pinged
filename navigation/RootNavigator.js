// navigation/RootNavigator.js
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useUser } from '../contexts/UserContext';
import { useOnboarding } from '../contexts/OnboardingContext';

import SplashScreen from '../screens/SplashScreen';
import AuthStack from './AuthStack';
import AppStack from './AppStack';
import OnboardingStack from './OnboardingStack';


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
        console.log('Deep linking to Chat');
      }
    };
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  if (isSplash || loading) {
    return <SplashScreen onFinish={() => setIsSplash(false)} />;
  }

  const onboarded = user?.onboardingComplete || hasOnboarded;

  if (!user) {
    return <AuthStack />;
  }

  if (!onboarded) {
    return <OnboardingStack />;
  }

  return <AppStack />;
}
