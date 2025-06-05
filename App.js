// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationCenter from './components/NotificationCenter';
import Toast from 'react-native-toast-message';

import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <NotificationCenter />
        <Toast />
      </NotificationProvider>
    </ThemeProvider>
  );
}
