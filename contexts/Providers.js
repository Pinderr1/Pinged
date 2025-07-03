import React from 'react';
import { DevProvider } from './DevContext';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { OnboardingProvider } from './OnboardingContext';
import { UserProvider } from './UserContext';
import { ListenerProvider } from './ListenerContext';
import { GameLimitProvider } from './GameLimitContext';
import { ChatProvider } from './ChatContext';
import { MatchmakingProvider } from './MatchmakingContext';
import { GameSessionProvider } from './GameSessionContext';
import { TrendingProvider } from './TrendingContext';
import { SoundProvider } from './SoundContext';
import { FilterProvider } from './FilterContext';

const Providers = ({ children }) => (
  <DevProvider>
    <OnboardingProvider>
      <UserProvider>
        <ThemeProvider>
          <SoundProvider>
            <AuthProvider>
              <NotificationProvider>
                <ListenerProvider>
                  <GameLimitProvider>
                    <FilterProvider>
                      <ChatProvider>
                        <MatchmakingProvider>
                          <TrendingProvider>
                            <GameSessionProvider>
                              {children}
                            </GameSessionProvider>
                          </TrendingProvider>
                        </MatchmakingProvider>
                      </ChatProvider>
                    </FilterProvider>
                  </GameLimitProvider>
                </ListenerProvider>
              </NotificationProvider>
            </AuthProvider>
          </SoundProvider>
        </ThemeProvider>
      </UserProvider>
    </OnboardingProvider>
  </DevProvider>
);

export default Providers;
