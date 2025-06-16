import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';
import usePremiumStatus from '../hooks/usePremiumStatus';
import { useDev } from './DevContext';
import log from '../utils/logger';

const GameLimitContext = createContext();
const STORAGE_KEY = 'gamesPlayed';
const DAILY_LIMIT = 1;

export const GameLimitProvider = ({ children }) => {
  const { user } = useUser();
  const { devMode } = useDev();
  const isPremium = usePremiumStatus();
  const [gamesLeft, setGamesLeft] = useState(isPremium ? Infinity : DAILY_LIMIT);

  useEffect(() => {
    if (isPremium || devMode) {
      setGamesLeft(Infinity);
      return;
    }
    const load = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const { date, count } = JSON.parse(data);
          const today = new Date().toDateString();
          if (date === today) {
            setGamesLeft(Math.max(DAILY_LIMIT - count, 0));
          } else {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setGamesLeft(DAILY_LIMIT);
          }
        }
      } catch (e) {
        log('Failed to load game limit', e);
      }
    };
    load();
  }, [isPremium, devMode]);

  const recordGamePlayed = async () => {
    if (isPremium || devMode) return;
    setGamesLeft((left) => {
      const next = Math.max(left - 1, 0);
      const today = new Date().toDateString();
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: today, count: DAILY_LIMIT - next })
      ).catch((e) => log('Save game limit failed', e));
      return next;
    });
  };

  return (
    <GameLimitContext.Provider value={{ gamesLeft, recordGamePlayed }}>
      {children}
    </GameLimitContext.Provider>
  );
};

export const useGameLimit = () => useContext(GameLimitContext);
