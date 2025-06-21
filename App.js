import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { ChatProvider } from './contexts/ChatContext';
import { MatchmakingProvider } from './contexts/MatchmakingContext';
import { GameSessionProvider } from './contexts/GameSessionContext';
import { DevProvider } from './contexts/DevContext';
import { GameLimitProvider } from './contexts/GameLimitContext';
import { ListenerProvider } from './contexts/ListenerContext';
import NotificationCenter from './components/NotificationCenter';
import DevBanner from './components/DevBanner';
import Toast from 'react-native-toast-message';
import usePushNotifications from './hooks/usePushNotifications';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  usePushNotifications();
  return (
    <DevProvider>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <OnboardingProvider>
              <UserProvider>
                <ListenerProvider>
                  <GameLimitProvider>
                    <ChatProvider>
                      <MatchmakingProvider>
                        <GameSessionProvider>
                          <NavigationContainer>
                            <RootNavigator />
                            <DevBanner />
                          </NavigationContainer>
                          <NotificationCenter />
                          <Toast />
                        </GameSessionProvider>
                      </MatchmakingProvider>
                    </ChatProvider>
                  </GameLimitProvider>
                </ListenerProvider>
              </UserProvider>
            </OnboardingProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </DevProvider>
  );
}
