// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UserProvider } from './contexts/UserContext';
import { ChatProvider } from './contexts/ChatContext';
import NotificationCenter from './components/NotificationCenter';
import Toast from 'react-native-toast-message';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <UserProvider>
          <ChatProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            <NotificationCenter />
            <Toast />
          </ChatProvider>
        </UserProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
