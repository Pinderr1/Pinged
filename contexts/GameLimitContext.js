import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import firebase from '../firebase';

const GameLimitContext = createContext();

export const GameLimitProvider = ({ children }) => {
  const { user } = useUser();
  const [gamesLeft, setGamesLeft] = useState(Infinity);
  const [limit, setLimit] = useState(Infinity);

  useEffect(() => {
    let cancelled = false;
    const fetchLimits = async () => {
      if (!user?.uid) return;
      try {
        const fn = firebase.functions().httpsCallable('getLimits');
        const res = await fn();
        if (!cancelled) {
          setGamesLeft(res.data.gamesLeft);
          setLimit(res.data.gameLimit);
        }
      } catch (e) {
        console.warn('Failed to fetch game limits', e);
      }
    };
    fetchLimits();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const recordGamePlayed = async () => {
    if (!user?.uid) return;
    try {
      await firebase.functions().httpsCallable('recordGamePlayed')();
      setGamesLeft((prev) => (prev === Infinity ? Infinity : Math.max(prev - 1, 0)));
    } catch (e) {
      console.error('Failed to record game played', e);
    }
  };

  return (
    <GameLimitContext.Provider value={{ gamesLeft, limit, recordGamePlayed }}>
      {children}
    </GameLimitContext.Provider>
  );
};

export const useGameLimit = () => useContext(GameLimitContext);
