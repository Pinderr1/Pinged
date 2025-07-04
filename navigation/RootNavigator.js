// navigation/RootNavigator.js
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { StatusBar, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useUser } from '../contexts/UserContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { logDev } from '../utils/logger';
import Constants from 'expo-constants';
import firebase from '../firebase';
import { isVersionLess } from '../utils/version';

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
    firebase
      .firestore()
      .collection('config')
      .doc('app')
      .get()
      .then((doc) => {
        if (!isMounted) return;
        const minVersion = doc.data()?.minVersion;
        if (
          minVersion &&
          isVersionLess(Constants.manifest.version, String(minVersion))
        ) {
          setRequiresUpdate(true);
        }
      })
      .catch((e) => console.warn('Failed to fetch app config', e));
    return () => {
      isMounted = false;
    };
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

  // Prefer the onboarding flag from the user's profile. Only fall back to
  // the locally persisted flag when the profile has not been loaded yet.
  const onboarded =
    user?.onboardingComplete !== undefined
      ? user.onboardingComplete
      : hasOnboarded;

  let content = null;
  if (requiresUpdate) {
    content = <UpdateScreen />;
  } else if (isSplash || loading) {
    content = <SplashScreen onFinish={() => setIsSplash(false)} />;
  } else if (!user) {
    content = <AuthStack />;
  } else if (!onboarded) {
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
