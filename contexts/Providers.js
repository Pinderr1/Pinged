import React from 'react';
import { DevProvider } from './DevContext';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { OnboardingProvider } from './OnboardingContext';
import { PresenceProvider } from './PresenceContext';
import { UserProvider } from './UserContext';
import { ListenerProvider } from './ListenerContext';
import { GameLimitProvider } from './GameLimitContext';
import { ChatProvider } from './ChatContext';
import { MatchmakingProvider } from './MatchmakingContext';
import { GameSessionProvider } from './GameSessionContext';

const Providers = ({ children }) => (
  <DevProvider>
    <ThemeProvider>
      <AuthProvider>
        <PresenceProvider>
          <NotificationProvider>
            <OnboardingProvider>
            <UserProvider>
              <ListenerProvider>
                <GameLimitProvider>
                  <ChatProvider>
                    <MatchmakingProvider>
                      <GameSessionProvider>{children}</GameSessionProvider>
                    </MatchmakingProvider>
                  </ChatProvider>
                </GameLimitProvider>
              </ListenerProvider>
            </UserProvider>
          </OnboardingProvider>
        </NotificationProvider>
        </PresenceProvider>
      </AuthProvider>
    </ThemeProvider>
  </DevProvider>
);

export default Providers;
