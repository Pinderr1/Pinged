import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';
import chatActions from './chatActions';
import firebase from '../firebase';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useSound } from './SoundContext';
import { useListeners } from './ListenerContext';
import debounce from '../utils/debounce';
import { initEncryption, encryptText } from '../utils/encryption';
import { useAnalytics } from './AnalyticsContext';

const ChatContext = createContext();
// Runtime actions for contexts that mount before ChatProvider

const STORAGE_PREFIX = 'chatMatches_';
const GAME_STATE_PREFIX = 'gameState_';
const STORAGE_VERSION = 1;

const getStateRef = (matchId) =>
  firebase
    .firestore()
    .collection('matches')
    .doc(matchId)
    .collection('state')
    .doc('current');

const updateMatchState = async (matchId, data) => {
  try {
    await getStateRef(matchId).set(data, { merge: true });
  } catch (e) {
    console.warn('Failed to update match state', e);
  }
};

const getStorageKey = (uid) => `${STORAGE_PREFIX}${uid}`;
const getGameStateKey = (matchId) => `${GAME_STATE_PREFIX}${matchId}`;

export const ChatProvider = ({ children }) => {
  const { user, blocked } = useUser();
  const { play } = useSound();
  const { logGameStarted } = useAnalytics();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastMessageRef = useRef(0);
  const matchStateListeners = useRef({});
  const presenceListeners = useRef({});

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

  useEffect(() => {
    if (!user?.uid) return;
    initEncryption(user.uid).catch((e) => {
      console.warn('Encryption init failed', e);
    });
  }, [user?.uid]);

  // Matches from ListenerContext
  const { matches: listenerMatches, loadMoreMatches, hasMoreMatches } = useListeners();

  useEffect(() => {
    if (!user?.uid) return;

    const data = listenerMatches;

    // Attach listeners for match state documents
    const activeState = matchStateListeners.current;
    data.forEach((m) => {
      if (!activeState[m.id]) {
        activeState[m.id] = getStateRef(m.id).onSnapshot((snap) => {
          const state = snap.data() || {};
          setMatches((prev) =>
            prev.map((p) =>
              p.id === m.id
                ? {
                    ...p,
                    activeGameId: state.activeGameId ?? null,
                    pendingInvite: state.pendingInvite ?? null,
                  }
                : p,
            ),
          );
        });
      }
    });
    Object.keys(activeState).forEach((id) => {
      if (!data.find((m) => m.id === id)) {
        activeState[id]();
        delete activeState[id];
      }
    });

    // Attach presence listeners for other users
    const activePresence = presenceListeners.current;
    const userIds = [];
    data.forEach((m) => {
      const otherId = Array.isArray(m.users)
        ? m.users.find((u) => u !== user.uid)
        : null;
      if (!otherId) return;
      userIds.push(otherId);
      if (!activePresence[otherId]) {
        const ref = firebase.database().ref(`/status/${otherId}`);
        const handler = ref.on('value', (snap) => {
          const val = snap.val() || {};
          setMatches((prev) =>
            prev.map((p) =>
              p.otherUserId === otherId
                ? {
                    ...p,
                    online: val.state === 'online',
                    image:
                      p.image ||
                      (val.photoURL ? { uri: val.photoURL } : p.image || require('../assets/user1.jpg')),
                    avatarOverlay: val.avatarOverlay || p.avatarOverlay || '',
                  }
                : p,
            ),
          );
        });
        activePresence[otherId] = { ref, handler };
      }
    });
    Object.keys(activePresence).forEach((id) => {
      if (!userIds.includes(id)) {
        activePresence[id].ref.off('value', activePresence[id].handler);
        delete activePresence[id];
      }
    });

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
    return () => {
      const active = matchStateListeners.current;
      Object.keys(active).forEach((id) => active[id]());
      matchStateListeners.current = {};
      const pres = presenceListeners.current;
      Object.keys(pres).forEach((id) =>
        pres[id].ref.off('value', pres[id].handler),
      );
      presenceListeners.current = {};
    };
  }, [listenerMatches, user?.uid]);

  // Ensure any remaining match state listeners are cleaned up when the provider
  // unmounts. This runs only once on mount and cleanup on unmount.
  useEffect(() => {
    return () => {
      const active = matchStateListeners.current;
      Object.keys(active).forEach((id) => active[id]());
      matchStateListeners.current = {};
      const pres = presenceListeners.current;
      Object.keys(pres).forEach((id) =>
        pres[id].ref.off('value', pres[id].handler),
      );
      presenceListeners.current = {};
    };
  }, []);


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
    const match = matches.find((m) => m.id === matchId);
    const otherId = match?.otherUserId;
    if (otherId) {
      let isBlocked = Array.isArray(blocked) && blocked.includes(otherId);
      if (!isBlocked) {
        try {
          const blockSnap = await firebase
            .firestore()
            .collection('blocks')
            .doc(otherId)
            .collection('blocked')
            .doc(user.uid)
            .get();
          isBlocked = blockSnap.exists;
        } catch (e) {
          console.warn('Failed to check block status', e);
        }
      }
      if (isBlocked) {
        removeMatch(matchId);
        Toast.show({ type: 'error', text1: 'User blocked' });
        return;
      }
    }
    const now = Date.now();
    if (now - lastMessageRef.current < 1000) {
      Toast.show({ type: 'error', text1: 'You are sending messages too quickly' });
      return;
    }
    lastMessageRef.current = now;

    const trimmed = removeEmojis(text).trim();
    if (!trimmed && !meta.voice) return;

    const { group, system, ...extras } = meta || {};

    try {
      await initEncryption(user.uid);
      const payload = {
        ...extras,
      };

      if (trimmed) {
        if (!group) {
          if (otherId) {
            const enc = await encryptText(trimmed, otherId);
            payload.ciphertext = enc.ciphertext;
            payload.nonce = enc.nonce;
          } else {
            payload.text = trimmed;
          }
        } else {
          payload.text = trimmed;
        }
      }

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
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          });
      } else {
        await firebase
          .functions()
          .httpsCallable('sendChatMessage')({
            matchId,
            system,
            message: payload,
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
    logGameStarted(gameId);
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, activeGameId: gameId, pendingInvite: null }
          : m
      )
    );
    updateMatchState(matchId, { activeGameId: gameId, pendingInvite: null });
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
    updateMatchState(matchId, { pendingInvite: { gameId, from } });
  };

  const clearGameInvite = (matchId) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, pendingInvite: null }
          : m
      )
    );
    updateMatchState(matchId, { pendingInvite: null });
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
      updateMatchState(matchId, {
        activeGameId: invite.gameId,
        pendingInvite: null,
      });
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
        .orderBy('updatedAt', 'desc')
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
        loadMoreMatches,
        hasMoreMatches,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => useContext(ChatContext);
