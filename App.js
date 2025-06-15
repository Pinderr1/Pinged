// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UserProvider } from './contexts/UserContext';
import { ChatProvider } from './contexts/ChatContext';
import { DevProvider } from './contexts/DevContext';
import { GameLimitProvider } from './contexts/GameLimitContext';
import NotificationCenter from './components/NotificationCenter';
import DevBanner from './components/DevBanner';
import Toast from 'react-native-toast-message';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <DevProvider>
      <ThemeProvider>
        <NotificationProvider>
          <UserProvider>
            <GameLimitProvider>
              <ChatProvider>
                <NavigationContainer>
                  <RootNavigator />
                  <DevBanner />
                </NavigationContainer>
                <NotificationCenter />
                <Toast />
              </ChatProvider>
            </GameLimitProvider>
          </UserProvider>
        </NotificationProvider>
      </ThemeProvider>
    </DevProvider>
  );
}
