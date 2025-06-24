import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDev } from './DevContext';
import { useUser } from './UserContext';
import { db, firebase } from '../firebase';
import { useListeners } from './ListenerContext';
import Toast from 'react-native-toast-message';

const ChatContext = createContext();

const STORAGE_KEY = 'chatMatches';

// Default to an empty match list; real matches are loaded from Firestore or
// AsyncStorage. Dummy entries were previously used here for demo purposes.
const initialMatches = [];

export const ChatProvider = ({ children }) => {
  const { devMode } = useDev();
  const { user } = useUser();
  const { getMessages } = useListeners();
  const devMatch = {
    id: '__testMatch',
    name: 'Dev Tester',
    age: 99,
    image: require('../assets/user1.jpg'),
    messages: [
      { id: 'dev1', text: 'Dev chat ready.', sender: 'system' },
    ],
    matchedAt: 'now',
    activeGameId: null,
    pendingInvite: null,
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

  // Subscribe to Firestore matches for the current user
  useEffect(() => {
    if (!user?.uid) return;
    const q = db.collection('matches').where('users', 'array-contains', user.uid);
    const unsub = q.onSnapshot((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMatches((prev) => {
        const others = prev.filter((m) => !data.find((d) => d.id === m.id));
        const converted = data.map((m) => ({
          id: m.id,
          name: m.name || 'Match',
          age: m.age || 0,
          image: m.image ? { uri: m.image } : require('../assets/user1.jpg'),
          messages: [],
          matchedAt: m.createdAt ? m.createdAt.toDate?.().toISOString() : 'now',
          activeGameId: null,
          pendingInvite: null,
        }));
        return [...others, ...converted];
      });
    });
    return unsub;
  }, [user?.uid]);

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


  const sendMessage = async (matchId, text, sender = 'you') => {
    if (!text || !matchId || !user?.uid) return;
    try {
      await db
        .collection('matches')
        .doc(matchId)
        .collection('messages')
        .add({
          senderId: sender === 'you' ? user.uid : sender,
          text: text.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
      if (sender === 'you') {
        Toast.show({ type: 'success', text1: 'Message sent' });
      }
    } catch (e) {
      console.warn('Failed to send message', e);
      if (sender === 'you') {
        Toast.show({ type: 'error', text1: 'Failed to send message' });
      }
    }
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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => useContext(ChatContext);
