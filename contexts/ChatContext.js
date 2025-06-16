import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDev } from './DevContext';
import usePremiumStatus from '../hooks/usePremiumStatus';

const ChatContext = createContext();

const STORAGE_KEY = 'chatMatches';

const initialMatches = [
  {
    id: '1',
    name: 'Emily',
    age: 25,
    image: require('../assets/user1.jpg'),
    messages: [
      { id: 'm1', text: 'Hey! Want to play a game?', sender: 'them', type: 'text' },
      { id: 'm2', text: 'Sure! Tic Tac Toe?', sender: 'you', type: 'text' },
      { id: 'm3', text: 'Sounds good!', sender: 'them', type: 'text' },
    ],
    matchedAt: '2 days ago',
    activeGameId: null,
    pendingInvite: null,
    isPremium: false,
  },
  {
    id: '2',
    name: 'Liam',
    age: 27,
    image: require('../assets/user2.jpg'),
    messages: [
      { id: 'm1', text: 'Ready for a rematch?', sender: 'them', type: 'text' },
    ],
    matchedAt: '1 day ago',
    activeGameId: null,
    pendingInvite: null,
    isPremium: true,
  },
  {
    id: '3',
    name: 'Ava',
    age: 23,
    image: require('../assets/user1.jpg'),
    messages: [
      { id: 'm1', text: 'BRB grabbing coffee ☕', sender: 'them', type: 'text' },
    ],
    matchedAt: '5 hours ago',
    activeGameId: null,
    pendingInvite: null,
    isPremium: false,
  },
];

export const ChatProvider = ({ children }) => {
  const { devMode } = useDev();
  const isPremium = usePremiumStatus();
  const devMatch = {
    id: '__testMatch',
    name: 'Dev Tester',
    age: 99,
    image: require('../assets/user1.jpg'),
    messages: [
      { id: 'dev1', text: 'Dev chat ready.', sender: 'system', type: 'text' },
    ],
    matchedAt: 'now',
    activeGameId: null,
    pendingInvite: null,
    isPremium: false,
  };

  const [matches, setMatches] = useState(
    devMode ? [...initialMatches, devMatch] : initialMatches
  );

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            setMatches(parsed);
          }
        } catch (e) {
          console.warn('Failed to parse matches from storage', e);
        }
      }
    });
  }, []);

  useEffect(() => {
    setMatches((prev) => {
      if (devMode) {
        if (!prev.find((m) => m.id === devMatch.id)) {
          console.log('Adding dev match');
          return [...prev, devMatch];
        }
        return prev;
      }
      return prev.filter((m) => m.id !== devMatch.id);
    });
  }, [devMode]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(matches)).catch((err) => {
      console.warn('Failed to save matches to storage', err);
    });
  }, [matches]);

  const sendMessage = (matchId, text, sender = 'you', type = 'text') => {
    if (!text) return;
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              messages: [
                ...m.messages,
                { id: Date.now().toString(), text, sender, type },
              ],
            }
          : m
      )
    );
  };

  const sendReaction = (matchId, emoji) => {
    if (!isPremium) return;
    sendMessage(matchId, emoji, 'you', 'reaction');
  };

  const sendVoiceMessage = (matchId) => {
    if (!isPremium) return;
    sendMessage(matchId, '[Voice Message]', 'you', 'voice');
  };

  const setActiveGame = (matchId, gameId) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, activeGameId: gameId, pendingInvite: null }
          : m
      )
    );
  };

  const sendGameInvite = (matchId, gameId, from = 'you') => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, pendingInvite: { gameId, from } }
          : m
      )
    );
    if (devMode) {
      console.log('Auto-accepting game invite');
      acceptGameInvite(matchId);
    }
  };

  const clearGameInvite = (matchId) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, pendingInvite: null }
          : m
      )
    );
  };

  const acceptGameInvite = (matchId) => {
    const invite = matches.find((m) => m.id === matchId)?.pendingInvite;
    if (invite) {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                activeGameId: invite.gameId,
                pendingInvite: null,
              }
            : m
        )
      );
    }
  };

  const getPendingInvite = (matchId) =>
    matches.find((m) => m.id === matchId)?.pendingInvite || null;

  const getActiveGame = (matchId) =>
    matches.find((m) => m.id === matchId)?.activeGameId || null;

  const getMessages = (matchId) =>
    matches.find((m) => m.id === matchId)?.messages || [];

  const addMatch = (match) =>
    setMatches((prev) => {
      if (prev.find((m) => m.id === match.id)) return prev;
      return [...prev, match];
    });

  const removeMatch = (matchId) =>
    setMatches((prev) => prev.filter((m) => m.id !== matchId));

  return (
    <ChatContext.Provider
      value={{
        matches,
        sendMessage,
        getMessages,
        addMatch,
        removeMatch,
        setActiveGame,
        getActiveGame,
        sendGameInvite,
        clearGameInvite,
        acceptGameInvite,
        getPendingInvite,
        sendReaction,
        sendVoiceMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => useContext(ChatContext);
