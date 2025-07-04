import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { useDev } from './DevContext';
import useRemoteConfig from '../hooks/useRemoteConfig';
import firebase from '../firebase';
import { logDev } from '../utils/logger';

const GameLimitContext = createContext();
const DEFAULT_LIMIT = 1;

export const GameLimitProvider = ({ children }) => {
  const { user } = useUser();
  const { devMode } = useDev();
  const { maxFreeGames } = useRemoteConfig();
  const isPremium = !!user?.isPremium;
  const limit = maxFreeGames ?? DEFAULT_LIMIT;
  const [gamesLeft, setGamesLeft] = useState(isPremium ? Infinity : limit);

  useEffect(() => {
    const dailyLimit = maxFreeGames ?? DEFAULT_LIMIT;
    if (isPremium || devMode) {
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
  }, [isPremium, devMode, user?.dailyPlayCount, user?.lastGamePlayedAt, maxFreeGames]);

  const recordGamePlayed = async () => {
    if (isPremium || devMode || !user?.uid) return;

    const last = user.lastGamePlayedAt?.toDate?.() ||
      (user.lastGamePlayedAt ? new Date(user.lastGamePlayedAt) : null);
    const today = new Date();
    let count = 1;
    if (last && last.toDateString() === today.toDateString()) {
      count = (user.dailyPlayCount || 0) + 1;
    }
    const dailyLimit = maxFreeGames ?? DEFAULT_LIMIT;
    setGamesLeft(Math.max(dailyLimit - count, 0));
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          dailyPlayCount: count,
          lastGamePlayedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    } catch (e) {
      logDev('Failed to update play count', e);
    }
  };

  return (
    <GameLimitContext.Provider value={{ gamesLeft, recordGamePlayed }}>
      {children}
    </GameLimitContext.Provider>
  );
};

export const useGameLimit = () => useContext(GameLimitContext);
