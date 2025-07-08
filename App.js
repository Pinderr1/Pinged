import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView, KeyboardAvoidingView, Platform, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useUser } from './contexts/UserContext';
import StreakRewardModal from './components/StreakRewardModal';
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

const AppInner = () => {
  usePushNotifications();
  // No custom fonts currently loaded
  const [fontsLoaded] = useFonts({});
  const { loaded: themeLoaded } = useTheme();
  const { loading: userLoading, streakReward, dismissStreakReward } = useUser();
  const {
    loading: configLoading,
    error: configError,
    alertMessage,
  } = useRemoteConfig();

  useEffect(() => {
    if (alertMessage) {
      Toast.show({ type: 'info', text1: alertMessage });
    }
  }, [alertMessage]);

  useEffect(() => {
    if (fontsLoaded && themeLoaded && !userLoading && !configLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, themeLoaded, userLoading, configLoading]);

  if (!fontsLoaded || !themeLoaded || userLoading || configLoading) {
    return null;
  }

  if (configError) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Failed to load configuration.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={60}
      >
        <ErrorBoundary>
          <NavigationContainer>
            <RootNavigator />
            <DevBanner />
          </NavigationContainer>
          <ThemedNotificationCenter />
          <StreakRewardModal
            visible={!!streakReward}
            streak={streakReward}
            onClose={dismissStreakReward}
          />
          <LoadingOverlay />
          <Toast />
        </ErrorBoundary>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <Providers>
      <AppInner />
    </Providers>
  );
}
