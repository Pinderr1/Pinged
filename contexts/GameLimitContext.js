import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import useRemoteConfig from '../hooks/useRemoteConfig';
import firebase from '../firebase';

const GameLimitContext = createContext();
const DEFAULT_LIMIT = 1;

export const GameLimitProvider = ({ children }) => {
  const { user } = useUser();
  const { maxFreeGames } = useRemoteConfig();
  const isPremium = !!user?.isPremium;
  const limit = maxFreeGames ?? DEFAULT_LIMIT;
  const [gamesLeft, setGamesLeft] = useState(isPremium ? Infinity : limit);

  useEffect(() => {
    setGamesLeft(isPremium ? Infinity : limit);
  }, [isPremium, limit]);

  const recordGamePlayed = async () => {
    if (isPremium || !user?.uid) return;
    try {
      const callable = firebase.functions().httpsCallable('recordGamePlay');
      const res = await callable();
      const remaining = res?.data?.gamesLeft;
      if (Number.isFinite(remaining)) setGamesLeft(remaining);
    } catch (e) {
      if (e?.message?.includes('Daily game limit')) {
        setGamesLeft(0);
      }
      throw e;
    }
  };

  return (
    <GameLimitContext.Provider value={{ gamesLeft, recordGamePlayed }}>
      {children}
    </GameLimitContext.Provider>
  );
};

export const useGameLimit = () => useContext(GameLimitContext);
