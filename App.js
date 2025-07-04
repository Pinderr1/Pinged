import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import Providers from './contexts/Providers';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationCenter from './components/NotificationCenter';
import DevBanner from './components/DevBanner';
import Toast from 'react-native-toast-message';
import usePushNotifications from './hooks/usePushNotifications';
import RootNavigator from './navigation/RootNavigator';
import { useTheme } from './contexts/ThemeContext';

const ThemedNotificationCenter = () => {
  const { theme } = useTheme();
  return <NotificationCenter color={theme.accent} />;
};

export default function App() {
  usePushNotifications();
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
            <Toast />
          </Providers>
        </ErrorBoundary>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
