import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { useDev } from './DevContext';
import firebase from '../firebase';

const GameLimitContext = createContext();
const DAILY_LIMIT = 1;

export const GameLimitProvider = ({ children }) => {
  const { user } = useUser();
  const { devMode } = useDev();
  const isPremium = !!user?.isPremium;
  const [gamesLeft, setGamesLeft] = useState(isPremium ? Infinity : DAILY_LIMIT);

  useEffect(() => {
    if (isPremium || devMode) {
      setGamesLeft(Infinity);
      return;
    }
    const last = user?.lastGamePlayedAt?.toDate?.() ||
      (user?.lastGamePlayedAt ? new Date(user.lastGamePlayedAt) : null);
    const today = new Date().toDateString();
    if (last && last.toDateString() === today) {
      setGamesLeft(Math.max(DAILY_LIMIT - (user.dailyPlayCount || 0), 0));
    } else {
      setGamesLeft(DAILY_LIMIT);
    }
  }, [isPremium, devMode, user?.dailyPlayCount, user?.lastGamePlayedAt]);

  const recordGamePlayed = async () => {
    if (isPremium || devMode || !user?.uid) return;

    const last = user.lastGamePlayedAt?.toDate?.() ||
      (user.lastGamePlayedAt ? new Date(user.lastGamePlayedAt) : null);
    const today = new Date();
    let count = 1;
    if (last && last.toDateString() === today.toDateString()) {
      count = (user.dailyPlayCount || 0) + 1;
    }
    setGamesLeft(Math.max(DAILY_LIMIT - count, 0));
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
      console.log('Failed to update play count', e);
    }
  };

  return (
    <GameLimitContext.Provider value={{ gamesLeft, recordGamePlayed }}>
      {children}
    </GameLimitContext.Provider>
  );
};

export const useGameLimit = () => useContext(GameLimitContext);
