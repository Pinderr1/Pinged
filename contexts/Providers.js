import React from 'react';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { OnboardingProvider } from './OnboardingContext';
import { UserProvider } from './UserContext';
import { ListenerProvider } from './ListenerContext';
import { GameLimitProvider } from './GameLimitContext';
import { EventLimitProvider } from './EventLimitContext';
import { LikeLimitProvider } from './LikeLimitContext';
import { ChatProvider } from './ChatContext';
import { MatchmakingProvider } from './MatchmakingContext';
import { GameSessionProvider } from './GameSessionContext';
import { TrendingProvider } from './TrendingContext';
import { SoundProvider } from './SoundContext';
import { FilterProvider } from './FilterContext';

const Providers = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      <NotificationProvider>
        <OnboardingProvider>
          <UserProvider>
            <ListenerProvider>
              <GameLimitProvider>
                <EventLimitProvider>
                  <LikeLimitProvider>
                    <SoundProvider>
                      <FilterProvider>
                        <ChatProvider>
                          <MatchmakingProvider>
                            <GameSessionProvider>
                              <TrendingProvider>
                                {children}
                              </TrendingProvider>
                            </GameSessionProvider>
                          </MatchmakingProvider>
                        </ChatProvider>
                      </FilterProvider>
                    </SoundProvider>
                  </LikeLimitProvider>
                </EventLimitProvider>
              </GameLimitProvider>
            </ListenerProvider>
          </UserProvider>
        </OnboardingProvider>
      </NotificationProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default Providers;
