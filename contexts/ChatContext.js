import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDev } from './DevContext';
import { useUser } from './UserContext';
import { db } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';
import { useListeners } from './ListenerContext';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';

const ChatContext = createContext();

const STORAGE_PREFIX = 'chatMatches_';

const getStorageKey = (uid) => `${STORAGE_PREFIX}${uid}`;

export const ChatProvider = ({ children }) => {
  const { devMode } = useDev();
  const { user } = useUser();
  const { getMessages } = useListeners();
  const devMatch = {
    id: '__testMatch',
    displayName: 'Dev Tester',
    age: 99,
    image: require('../assets/user1.jpg'),
    messages: [
      { id: 'dev1', text: 'Dev chat ready.', sender: 'system' },
    ],
    matchedAt: 'now',
    online: true,
    activeGameId: null,
    pendingInvite: null,
  };

  // Start with no matches and inject a tester match when dev mode is enabled.
  const [matches, setMatches] = useState(devMode ? [devMatch] : []);

  useEffect(() => {
    if (!user?.uid) {
      setMatches(devMode ? [devMatch] : []);
      return;
    }
    AsyncStorage.getItem(getStorageKey(user.uid)).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            setMatches(devMode ? [...parsed, devMatch].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i) : parsed);
          } else {
            setMatches(devMode ? [devMatch] : []);
          }
        } catch (e) {
          console.warn('Failed to parse matches from storage', e);
          setMatches(devMode ? [devMatch] : []);
        }
      } else {
        setMatches(devMode ? [devMatch] : []);
      }
    });
  }, [user?.uid, devMode]);

  // Subscribe to Firestore matches for the current user
  const userUnsubs = useRef({});
  useEffect(() => {
    if (!user?.uid) return;
    const q = db.collection('matches').where('users', 'array-contains', user.uid);
    const unsub = q.onSnapshot((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      setMatches((prev) => {
        const others = prev.filter((m) => !data.find((d) => d.id === m.id));
        const converted = data.map((m) => {
          const otherId = Array.isArray(m.users)
            ? m.users.find((u) => u !== user.uid)
            : null;
          const prevMatch = prev.find((p) => p.id === m.id) || {};
          return {
            id: m.id,
            otherUserId: otherId,
            displayName: prevMatch.displayName || 'Match',
            age: prevMatch.age || 0,
            image: prevMatch.image || require('../assets/user1.jpg'),
            online: prevMatch.online || false,
            messages: prevMatch.messages || [],
            matchedAt: m.createdAt
              ? m.createdAt.toDate?.().toISOString()
              : 'now',
            activeGameId: prevMatch.activeGameId || null,
            pendingInvite: prevMatch.pendingInvite || null,
          };
        });
        return [...others, ...converted];
      });

      const userIds = data
        .map((m) =>
          Array.isArray(m.users) ? m.users.find((u) => u !== user.uid) : null
        )
        .filter(Boolean);

      // Cleanup listeners for removed users
      Object.keys(userUnsubs.current).forEach((uid) => {
        if (!userIds.includes(uid)) {
          userUnsubs.current[uid]();
          delete userUnsubs.current[uid];
        }
      });

      // Subscribe to each user's profile for presence
      userIds.forEach((uid) => {
        if (!userUnsubs.current[uid]) {
          userUnsubs.current[uid] = db
            .collection('users')
            .doc(uid)
            .onSnapshot((doc) => {
              const info = doc.data() || {};
              setMatches((prev) =>
                prev.map((m) =>
                  m.otherUserId === uid
                    ? {
                        ...m,
                        displayName: info.displayName || 'User',
                        age: info.age || 0,
                        image: info.photoURL
                          ? { uri: info.photoURL }
                          : require('../assets/user1.jpg'),
                        online: !!info.online,
                      }
                    : m
                )
              );
            });
        }
      });
    });
    return () => {
      unsub();
      Object.values(userUnsubs.current).forEach((fn) => fn && fn());
      userUnsubs.current = {};
    };
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
    if (!user?.uid) return;
    const data = matches.filter((m) => m.id !== devMatch.id);
    AsyncStorage.setItem(getStorageKey(user.uid), JSON.stringify(data)).catch((err) => {
      console.warn('Failed to save matches to storage', err);
    });
  }, [matches, user?.uid]);


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
        timestamp: serverTimestamp(),
        });
      if (sender === 'you') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
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

  // Start a local game against the other user. This only updates the local
  // matches state and does not create an online invite.
  const startLocalGame = (matchId, gameId, from = 'you') => {
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
        startLocalGame,
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
