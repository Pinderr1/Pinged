import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { ChatProvider } from './contexts/ChatContext';
import { MatchmakingProvider } from './contexts/MatchmakingContext';
import { DevProvider } from './contexts/DevContext';
import { GameLimitProvider } from './contexts/GameLimitContext';
import NotificationCenter from './components/NotificationCenter';
import DevBanner from './components/DevBanner';
import Toast from 'react-native-toast-message';
import usePushNotifications from './hooks/usePushNotifications';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  usePushNotifications();
  return (
    <DevProvider>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <OnboardingProvider>
              <UserProvider>
                <GameLimitProvider>
                  <ChatProvider>
                    <MatchmakingProvider>
                      <NavigationContainer>
                        <RootNavigator />
                        <DevBanner />
                      </NavigationContainer>
                      <NotificationCenter />
                      <Toast />
                    </MatchmakingProvider>
                  </ChatProvider>
                </GameLimitProvider>
              </UserProvider>
            </OnboardingProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </DevProvider>
  );
}
