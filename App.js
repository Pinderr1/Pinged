import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Providers from './contexts/Providers';
import NotificationCenter from './components/NotificationCenter';
import DevBanner from './components/DevBanner';
import Toast from 'react-native-toast-message';
import usePushNotifications from './hooks/usePushNotifications';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  usePushNotifications();
  return (
    <Providers>
      <NavigationContainer>
        <RootNavigator />
        <DevBanner />
      </NavigationContainer>
      <NotificationCenter />
      <Toast />
    </Providers>
  );
}
