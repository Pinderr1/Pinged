import React from 'react';
import { DevProvider } from './DevContext';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { LoadingProvider } from './LoadingContext';
import { ConfigProvider } from './ConfigContext';
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
    <ConfigProvider>
      <LoadingProvider>
        <AuthProvider>
          <OnboardingProvider>
            <UserProvider>
              <ThemeProvider>
                <SoundProvider>
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
                </SoundProvider>
              </ThemeProvider>
            </UserProvider>
          </OnboardingProvider>
        </AuthProvider>
      </LoadingProvider>
    </ConfigProvider>
  </DevProvider>
);

export default Providers;
