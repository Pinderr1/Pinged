import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { UserProvider } from './contexts/UserContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { ChatProvider } from './contexts/ChatContext';
import { MatchmakingProvider } from './contexts/MatchmakingContext';
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
        <OnboardingProvider>
          <UserProvider>
            <NotificationProvider>
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
            </NotificationProvider>
          </UserProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </DevProvider>
  );
}
