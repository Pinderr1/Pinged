import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useUser } from './contexts/UserContext';
import Providers from './contexts/Providers';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationCenter from './components/NotificationCenter';
import DevBanner from './components/DevBanner';
import LoadingOverlay from './components/LoadingOverlay';
import Toast from 'react-native-toast-message';
import usePushNotifications from './hooks/usePushNotifications';
import useRemoteConfig from './hooks/useRemoteConfig';
import RootNavigator from './navigation/RootNavigator';
import { useTheme } from './contexts/ThemeContext';

const ThemedNotificationCenter = () => {
  const { theme } = useTheme();
  return <NotificationCenter color={theme.accent} />;
};

export default function App() {
  usePushNotifications();
  const [fontsLoaded] = useFonts({});
  const { loaded: themeLoaded } = useTheme();
  const { loading: userLoading } = useUser();
  const { loading: configLoading } = useRemoteConfig();

  useEffect(() => {
    if (fontsLoaded && themeLoaded && !userLoading && !configLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, themeLoaded, userLoading, configLoading]);

  if (!fontsLoaded || !themeLoaded || userLoading || configLoading) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={60}
      >
        <ErrorBoundary>
          <Providers>
            <NavigationContainer>
              <RootNavigator />
              <DevBanner />
            </NavigationContainer>
            <ThemedNotificationCenter />
            <LoadingOverlay />
            <Toast />
          </Providers>
        </ErrorBoundary>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
