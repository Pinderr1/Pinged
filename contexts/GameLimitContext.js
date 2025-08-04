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
    const dailyLimit = maxFreeGames ?? DEFAULT_LIMIT;
    if (isPremium || !user?.uid) {
      setGamesLeft(Infinity);
      return;
    }
    firebase
      .functions()
      .httpsCallable('getGamesRemaining')()
      .then((res) => {
        const left = res?.data?.gamesLeft;
        setGamesLeft(
          typeof left === 'number' ? Math.max(left, 0) : dailyLimit
        );
      })
      .catch(() => setGamesLeft(dailyLimit));
  }, [isPremium, user?.uid, maxFreeGames]);

  const recordGamePlayed = async () => {
    if (isPremium || !user?.uid) return;
    try {
      const res = await firebase
        .functions()
        .httpsCallable('recordGamePlay')();
      const left = res?.data?.gamesLeft;
      setGamesLeft(typeof left === 'number' ? Math.max(left, 0) : 0);
    } catch (e) {
      console.error('Failed to record play count', e);
    }
  };

  return (
    <GameLimitContext.Provider value={{ gamesLeft, recordGamePlayed }}>
      {children}
    </GameLimitContext.Provider>
  );
};

export const useGameLimit = () => useContext(GameLimitContext);
