import React from 'react';
import { MatchesProvider, useMatches } from './MatchesContext';
import { GameProvider, useGame } from './GameContext';
import { PresenceProvider, usePresence } from './PresenceContext';

export const ChatProvider = ({ children }) => (
  <MatchesProvider>
    <PresenceProvider>
      <GameProvider>{children}</GameProvider>
    </PresenceProvider>
  </MatchesProvider>
);

export const useChats = () => ({
  ...useMatches(),
  ...useGame(),
});

export { useMatches, useGame, usePresence };
