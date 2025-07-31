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
import { LoadingProvider } from './LoadingContext';

const Providers = ({ children }) => (
  <AuthProvider>
      <OnboardingProvider>
        <UserProvider>
          <ThemeProvider>
            <LoadingProvider>
              <SoundProvider>
                <NotificationProvider>
                  <ListenerProvider>
                    <GameLimitProvider>
                      <EventLimitProvider>
                        <LikeLimitProvider>
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
                        </LikeLimitProvider>
                      </EventLimitProvider>
                    </GameLimitProvider>
                  </ListenerProvider>
                </NotificationProvider>
              </SoundProvider>
            </LoadingProvider>
          </ThemeProvider>
        </UserProvider>
      </OnboardingProvider>
    </AuthProvider>
);

export default Providers;
