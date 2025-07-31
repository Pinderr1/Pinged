import React, { createContext, useContext, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMatches } from './MatchesContext';
import debounce from '../utils/debounce';

const GAME_STATE_PREFIX = 'gameState_';
const STORAGE_VERSION = 1;
const getGameStateKey = (matchId) => `${GAME_STATE_PREFIX}${matchId}`;

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const { matches, setMatches } = useMatches();
  const gameStateSavers = useRef({});

  const setActiveGame = (matchId, gameId) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, activeGameId: gameId, pendingInvite: null } : m
      )
    );
  };

  const startLocalGame = (matchId, gameId, from = 'you') => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, pendingInvite: { gameId, from } } : m
      )
    );
  };

  const clearGameInvite = (matchId) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, pendingInvite: null } : m))
    );
  };

  const acceptGameInvite = (matchId) => {
    const invite = matches.find((m) => m.id === matchId)?.pendingInvite;
    if (invite) {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, activeGameId: invite.gameId, pendingInvite: null }
            : m
        )
      );
    }
  };

  const getPendingInvite = (matchId) =>
    matches.find((m) => m.id === matchId)?.pendingInvite || null;

  const getActiveGame = (matchId) =>
    matches.find((m) => m.id === matchId)?.activeGameId || null;

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

  const saveGameState = (matchId, state) => {
    if (!gameStateSavers.current[matchId]) {
      gameStateSavers.current[matchId] = debounce((data) => {
        AsyncStorage.setItem(
          getGameStateKey(matchId),
          JSON.stringify({ v: STORAGE_VERSION, data })
        ).catch((e) => {
          console.warn('Failed to save game state', e);
        });
      }, 10000);
    }
    gameStateSavers.current[matchId](state);
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
        setActiveGame,
        getActiveGame,
        getSavedGameState,
        saveGameState,
        clearGameState,
        startLocalGame,
        clearGameInvite,
        acceptGameInvite,
        getPendingInvite,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
