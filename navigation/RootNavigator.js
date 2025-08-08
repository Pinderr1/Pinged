// navigation/RootNavigator.js
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Alert, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useUser } from '../contexts/UserContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import Constants from 'expo-constants';
import firebase from '../firebase';
import { isVersionLess } from '../utils/version';
import logger from '../utils/logger';

const SplashScreen = lazy(() => import('../screens/SplashScreen'));
const AuthStack = lazy(() => import('./AuthStack'));
const AppStack = lazy(() => import('./AppStack'));
const OnboardingStack = lazy(() => import('./OnboardingStack'));
const UpdateScreen = lazy(() => import('../screens/UpdateScreen'));


const splashDuration = 2000;

export default function RootNavigator() {
  const [isSplash, setIsSplash] = useState(true);
  const [requiresUpdate, setRequiresUpdate] = useState(false);
  const { user, loading } = useUser();
  const { hasOnboarded } = useOnboarding();

  useEffect(() => {
    const timer = setTimeout(() => setIsSplash(false), splashDuration);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadConfig = async () => {
      try {
        const doc = await firebase
          .firestore()
          .collection('config')
          .doc('app')
          .get();
        if (!isMounted) return;
        const minVersion = doc.data()?.minVersion;
        const currentVersion =
          Constants.expoConfig?.version || Constants.manifest?.version;
        if (minVersion && isVersionLess(currentVersion, String(minVersion))) {
          setRequiresUpdate(true);
        }
      } catch (e) {
        logger.error('Failed to fetch app config', e);
        Alert.alert('Error', 'Unable to load configuration.');
      }
    };
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      const parsed = Linking.parse(url);
      if (parsed.path === 'chat') {
        // deep link to chat
      }
    };
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  // Prefer the onboarding flag from the user's profile. Only fall back to
  // the locally persisted flag when the profile has not been loaded yet.
  const onboarded =
    user?.onboardingCompleted !== undefined
      ? user.onboardingCompleted
      : hasOnboarded;

  let content = null;
  if (requiresUpdate) {
    content = <UpdateScreen />;
  } else if (isSplash || loading) {
    content = <SplashScreen onFinish={() => setIsSplash(false)} />;
  } else if (!user) {
    content = <AuthStack />;
  } else if (!onboarded || !user.phoneVerified) {
    content = <OnboardingStack />;
  } else {
    content = <AppStack />;
  }

  return (
    <Suspense
      fallback={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      }
    >
      {content}
    </Suspense>
  );
}
