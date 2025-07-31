import React, { createContext, useContext } from 'react';
import { MatchesProvider, useMatches } from './MatchesContext';
import { PresenceProvider, usePresence } from './PresenceContext';
import { GameProvider, useGame } from './GameContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => (
  <MatchesProvider>
    <PresenceProvider>
      <GameProvider>
        {children}
      </GameProvider>
    </PresenceProvider>
  </MatchesProvider>
);

export const useChats = () => {
  return {
    ...useMatches(),
    ...usePresence(),
    ...useGame(),
  };
};

export default ChatContext;
