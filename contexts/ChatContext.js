import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';
import firebase from '../firebase';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useSound } from './SoundContext';
import { useListeners } from './ListenerContext';
import debounce from '../utils/debounce';

const ChatContext = createContext();
// Expose runtime actions for contexts that mount before ChatProvider
export const chatActions = {};

const STORAGE_PREFIX = 'chatMatches_';
const GAME_STATE_PREFIX = 'gameState_';
const STORAGE_VERSION = 1;

const getStorageKey = (uid) => `${STORAGE_PREFIX}${uid}`;
const getGameStateKey = (matchId) => `${GAME_STATE_PREFIX}${matchId}`;

export const ChatProvider = ({ children }) => {
  const { user } = useUser();
  const { play } = useSound();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!user?.uid) {
      if (isMounted) {
        setMatches([]);
        setLoading(false);
      }
      return () => {
        isMounted = false;
      };
    }
    setLoading(true);
    AsyncStorage.getItem(getStorageKey(user.uid))
      .then((data) => {
        if (data) {
          try {
            const parsed = JSON.parse(data);
            const list = Array.isArray(parsed)
              ? parsed
              : Array.isArray(parsed?.data)
              ? parsed.data
              : [];
            const converted = list.map((m) => {
              const { name, ...rest } = m;
              return {
                ...rest,
                displayName: m.displayName || name || 'Match',
              };
            });
            if (isMounted) {
              setMatches(converted);
            }
          } catch (e) {
            console.warn('Failed to parse matches from storage', e);
            if (isMounted) setMatches([]);
          }
        } else {
          if (isMounted) setMatches([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // Matches from ListenerContext
  const userUnsubs = useRef({});
  const presenceCache = useRef({});
  const { matches: listenerMatches } = useListeners();

  useEffect(() => {
    if (!user?.uid) return;

    const data = listenerMatches;

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
          avatarOverlay: prevMatch.avatarOverlay || '',
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

    setLoading(false);

    const topFive = [...data]
      .sort((a, b) => {
        const aT = a.createdAt?.toDate?.().getTime?.() || 0;
        const bT = b.createdAt?.toDate?.().getTime?.() || 0;
        return bT - aT;
      })
      .slice(0, 5);

    const userIds = topFive
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
        userUnsubs.current[uid] = firebase
          .firestore()
          .collection('users')
          .doc(uid)
          .onSnapshot(
            { includeMetadataChanges: true },
            (doc) => {
              const info = doc.data() || {};
              presenceCache.current[uid] = info;
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
                        avatarOverlay: info.avatarOverlay || m.avatarOverlay || '',
                        online: !!info.online,
                      }
                    : m
                )
              );
            }
          );
      }
    });
  }, [listenerMatches, user?.uid]);

  useEffect(() => {
    return () => {
      Object.values(userUnsubs.current).forEach((fn) => fn && fn());
      userUnsubs.current = {};
    };
  }, [user?.uid]);


  const saveMatchesToStorageRef = useRef(null);

  useEffect(() => {
    if (!user?.uid) return;
    saveMatchesToStorageRef.current = debounce((data) => {
      AsyncStorage.setItem(
        getStorageKey(user.uid),
        JSON.stringify({ v: STORAGE_VERSION, data })
      ).catch((err) => {
        console.warn('Failed to save matches to storage', err);
      });
    }, 10000);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !saveMatchesToStorageRef.current) return;
    saveMatchesToStorageRef.current(matches);
  }, [matches, user?.uid]);


  const removeEmojis = (str) =>
    str?.replace(/\p{Extended_Pictographic}/gu, '') || '';

  const sendMessage = async ({ matchId, text = '', meta = {} }) => {
    if (!matchId || !user?.uid) return;
    const trimmed = removeEmojis(text).trim();
    if (!trimmed && !meta.voice) return;

    const { group, system, ...extras } = meta || {};

    try {
      const payload = {
        text: trimmed,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        ...extras,
      };

      if (group) {
        await firebase
          .firestore()
          .collection('events')
          .doc(matchId)
          .collection('messages')
          .add({
            user: user?.displayName || 'You',
            userId: user?.uid || null,
            reactions: [],
            pinned: false,
            ...payload,
          });
      } else {
        await firebase
          .firestore()
          .collection('matches')
          .doc(matchId)
          .collection('messages')
          .add({
            senderId: system ? 'system' : user.uid,
            reactions: {},
            ...payload,
          });
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      play('message');
      Toast.show({ type: 'success', text1: 'Message sent' });
    } catch (e) {
      console.warn('Failed to send message', e);
      Toast.show({ type: 'error', text1: 'Failed to send message' });
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

  const gameStateSavers = useRef({});

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


  const addMatch = (match) =>
    setMatches((prev) => {
      if (prev.find((m) => m.id === match.id)) return prev;
      return [...prev, match];
    });

  const removeMatch = (matchId) =>
    setMatches((prev) => prev.filter((m) => m.id !== matchId));

  const removeMatchesWithUser = (uid) =>
    setMatches((prev) => {
      const remaining = prev.filter((m) => m.otherUserId !== uid);
      const removed = prev.filter((m) => m.otherUserId === uid);
      removed.forEach((m) => clearGameState(m.id));
      return remaining;
    });

  const refreshMatches = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const snap = await firebase
        .firestore()
        .collection('matches')
        .where('users', 'array-contains', user.uid)
        .get();
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
            avatarOverlay: prevMatch.avatarOverlay || '',
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
    } catch (e) {
      console.warn('Failed to refresh matches', e);
    }
    setLoading(false);
  };

  // expose functions for other contexts (e.g., UserContext) that load earlier
  chatActions.removeMatchesWithUser = removeMatchesWithUser;
  chatActions.removeMatch = removeMatch;
  chatActions.clearGameState = clearGameState;

  return (
    <ChatContext.Provider
      value={{
        matches,
        loading,
        sendMessage,
        addMatch,
        removeMatch,
        removeMatchesWithUser,
        setActiveGame,
        getActiveGame,
        getSavedGameState,
        saveGameState,
        clearGameState,
        startLocalGame,
        clearGameInvite,
        acceptGameInvite,
        getPendingInvite,
        refreshMatches,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => useContext(ChatContext);
