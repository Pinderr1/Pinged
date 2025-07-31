import React, { createContext, useContext, useEffect, useRef } from 'react';
import create from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from '../utils/debounce';
import { useUser } from './UserContext';

const GAME_STATE_PREFIX = 'gameState_';
const STORAGE_VERSION = 1;
const getGameStateKey = (matchId) => `${GAME_STATE_PREFIX}${matchId}`;

const useGameStore = create((set) => ({
  activeGames: {}, // matchId -> gameId
  invites: {}, // matchId -> { gameId, from }
  setActive: (matchId, gameId) =>
    set((state) => ({
      activeGames: { ...state.activeGames, [matchId]: gameId },
      invites: { ...state.invites, [matchId]: null },
    })),
  startInvite: (matchId, gameId, from) =>
    set((state) => ({
      invites: { ...state.invites, [matchId]: { gameId, from } },
    })),
  clearInvite: (matchId) =>
    set((state) => ({ invites: { ...state.invites, [matchId]: null } })),
}));

const GameContext = createContext(useGameStore);

export const GameProvider = ({ children }) => {
  const { user } = useUser();
  const stateSavers = useRef({});

  const saveGameState = (matchId, state) => {
    if (!stateSavers.current[matchId]) {
      stateSavers.current[matchId] = debounce((data) => {
        AsyncStorage.setItem(
          getGameStateKey(matchId),
          JSON.stringify({ v: STORAGE_VERSION, data })
        ).catch((e) => {
          console.warn('Failed to save game state', e);
        });
      }, 10000);
    }
    stateSavers.current[matchId](state);
  };

  const getSavedGameState = async (matchId) => {
    try {
      const val = await AsyncStorage.getItem(getGameStateKey(matchId));
      if (!val) return null;
      const parsed = JSON.parse(val);
      return parsed?.data ?? parsed;
    } catch (e) {
      console.warn('Failed to load game state', e);
      return null;
    }
  };

  const clearGameState = async (matchId) => {
    try {
      await AsyncStorage.removeItem(getGameStateKey(matchId));
    } catch (e) {
      console.warn('Failed to clear game state', e);
    }
  };

  return (
    <GameContext.Provider
      value={{
        useStore: useGameStore,
        saveGameState,
        getSavedGameState,
        clearGameState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  const store = ctx?.useStore || useGameStore;
  return {
    activeGames: store((s) => s.activeGames),
    invites: store((s) => s.invites),
    setActive: store((s) => s.setActive),
    startInvite: store((s) => s.startInvite),
    clearInvite: store((s) => s.clearInvite),
    saveGameState: ctx.saveGameState,
    getSavedGameState: ctx.getSavedGameState,
    clearGameState: ctx.clearGameState,
  };
};
