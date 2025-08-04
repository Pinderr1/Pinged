import React, { createContext, useContext } from 'react';
import analytics from '../utils/analytics';

const AnalyticsContext = createContext();

export const AnalyticsProvider = ({ children }) => {
  const logSwipe = (direction) => {
    analytics.logEvent(`swipe_${direction}`);
  };

  const logMatchCreated = () => {
    analytics.logEvent('match_created');
  };

  const logGameStarted = (gameId) => {
    analytics.logEvent('game_started', { gameId });
  };

  const logEventJoined = (eventId) => {
    analytics.logEvent('event_joined', { eventId });
  };

  const logUpgradeClicked = () => {
    analytics.logEvent('upgrade_clicked');
  };

  return (
    <AnalyticsContext.Provider
      value={{
        logSwipe,
        logMatchCreated,
        logGameStarted,
        logEventJoined,
        logUpgradeClicked,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => useContext(AnalyticsContext);
