import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { useDev } from './DevContext';
import { useUser } from './UserContext';
import { db } from '../firebase';

const ChatContext = createContext();

const STORAGE_KEY = 'chatMatches';

const initialMatches = [
  {
    id: '1',
    name: 'Emily',
    age: 25,
    image: require('../assets/user1.jpg'),
    messages: [
      { id: 'm1', text: 'Hey! Want to play a game?', sender: 'them' },
      { id: 'm2', text: 'Sure! Tic Tac Toe?', sender: 'you' },
      { id: 'm3', text: 'Sounds good!', sender: 'them' },
    ],
    matchedAt: '2 days ago',
    activeGameId: null,
    pendingInvite: null,
  },
  {
    id: '2',
    name: 'Liam',
    age: 27,
    image: require('../assets/user2.jpg'),
    messages: [
      { id: 'm1', text: 'Ready for a rematch?', sender: 'them' },
    ],
    matchedAt: '1 day ago',
    activeGameId: null,
    pendingInvite: null,
  },
  {
    id: '3',
    name: 'Ava',
    age: 23,
    image: require('../assets/user1.jpg'),
    messages: [
      { id: 'm1', text: 'BRB grabbing coffee ☕', sender: 'them' },
    ],
    matchedAt: '5 hours ago',
    activeGameId: null,
    pendingInvite: null,
  },
];

export const ChatProvider = ({ children }) => {
  const { devMode } = useDev();
  const { user } = useUser();
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
  const [messagesMap, setMessagesMap] = useState({});

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
    const q = query(collection(db, 'matches'), where('users', 'array-contains', user.uid));
    const unsub = onSnapshot(q, (snap) => {
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

  useEffect(() => {
    if (!user?.uid) return;
    const unsubs = matches.map((m) => {
      const q = query(
        collection(db, 'matches', m.id, 'messages'),
        orderBy('timestamp', 'asc')
      );
      return onSnapshot(q, (snap) => {
        const msgs = snap.docs.map((d) => {
          const val = d.data();
          return {
            id: d.id,
            text: val.text,
            sender:
              val.senderId === user.uid
                ? 'you'
                : val.senderId || 'them',
          };
        });
        setMessagesMap((prev) => ({ ...prev, [m.id]: msgs }));
      });
    });
    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, [user?.uid, matches.map((m) => m.id).join(',')]);

  const sendMessage = async (matchId, text, sender = 'you') => {
    if (!text || !matchId || !user?.uid) return;
    try {
      await addDoc(collection(db, 'matches', matchId, 'messages'), {
        senderId: sender === 'you' ? user.uid : sender,
        text: text.trim(),
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Failed to send message', e);
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

  const getMessages = (matchId) =>
    messagesMap[matchId] || [];

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
