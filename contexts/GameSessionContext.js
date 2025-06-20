import React, { createContext, useContext } from 'react';
import { useListeners } from './ListenerContext';

const GameSessionContext = createContext();

export const GameSessionProvider = ({ children }) => {
  const { sessions } = useListeners();

  return (
    <GameSessionContext.Provider value={{ sessions }}>
      {children}
    </GameSessionContext.Provider>
  );
};

export const useGameSessions = () => useContext(GameSessionContext);
