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
    if (isPremium) {
      setGamesLeft(Infinity);
      return;
    }
    const last = user?.lastGamePlayedAt?.toDate?.() ||
      (user?.lastGamePlayedAt ? new Date(user.lastGamePlayedAt) : null);
    const today = new Date().toDateString();
    if (last && last.toDateString() === today) {
      setGamesLeft(Math.max(dailyLimit - (user.dailyPlayCount || 0), 0));
    } else {
      setGamesLeft(dailyLimit);
    }
  }, [isPremium, user?.dailyPlayCount, user?.lastGamePlayedAt, maxFreeGames]);

  const recordGamePlayed = async () => {
    if (isPremium || !user?.uid) return;

    try {
      const res = await firebase
        .functions()
        .httpsCallable('recordGamePlayed')();
      const remaining = res?.data?.remaining;
      if (Number.isFinite(remaining)) {
        setGamesLeft(remaining);
      }
    } catch (e) {
      if (e?.message?.includes('Daily game limit')) {
        setGamesLeft(0);
      } else {
        console.error('Failed to update play count', e);
      }
    }
  };

  return (
    <GameLimitContext.Provider value={{ gamesLeft, recordGamePlayed }}>
      {children}
    </GameLimitContext.Provider>
  );
};

export const useGameLimit = () => useContext(GameLimitContext);
