import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './UserContext';
import { useListeners } from './ListenerContext';
import firebase from '../firebase';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { useSound } from './SoundContext';
import debounce from '../utils/debounce';

const STORAGE_PREFIX = 'chatMatches_';
const STORAGE_VERSION = 1;
const getStorageKey = (uid) => `${STORAGE_PREFIX}${uid}`;

const MatchesContext = createContext();

export const MatchesProvider = ({ children }) => {
  const { user } = useUser();
  const { play } = useSound();
  const { matches: listenerMatches, loadMoreMatches, hasMoreMatches } = useListeners();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastMessageRef = useRef(0);

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
            const converted = list.map((m) => ({
              ...m,
              displayName: m.displayName || m.name || 'Match',
            }));
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
    const data = listenerMatches;
    setMatches((prev) => {
      const others = prev.filter((m) => !data.find((d) => d.id === m.id));
      const converted = data.map((m) => {
        const otherId = Array.isArray(m.users)
          ? m.users.find((u) => u !== user.uid)
          : null;
        const prevMatch = prev.find((p) => p.id === m.id) || {};
        const presence = (m.presence && otherId && m.presence[otherId]) || {};
        return {
          id: m.id,
          otherUserId: otherId,
          displayName: prevMatch.displayName || 'Match',
          age: prevMatch.age || 0,
          image:
            prevMatch.image ||
            (presence.photoURL ? { uri: presence.photoURL } : require('../assets/user1.jpg')),
          avatarOverlay: prevMatch.avatarOverlay || presence.avatarOverlay || '',
          online: prevMatch.online || !!presence.online,
          messages: prevMatch.messages || [],
          matchedAt: m.createdAt ? m.createdAt.toDate?.().toISOString() : 'now',
          activeGameId: prevMatch.activeGameId || null,
          pendingInvite: prevMatch.pendingInvite || null,
        };
      });
      return [...others, ...converted];
    });
    setLoading(false);
  }, [listenerMatches, user?.uid]);

  const saveMatchesRef = useRef(null);
  useEffect(() => {
    if (!user?.uid) return;
    saveMatchesRef.current = debounce((data) => {
      AsyncStorage.setItem(getStorageKey(user.uid), JSON.stringify({ v: STORAGE_VERSION, data })).catch((err) => {
        console.warn('Failed to save matches to storage', err);
      });
    }, 10000);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !saveMatchesRef.current) return;
    saveMatchesRef.current(matches);
  }, [matches, user?.uid]);

  const removeEmojis = (str) => str?.replace(/\p{Extended_Pictographic}/gu, '') || '';

  const sendMessage = async ({ matchId, text = '', meta = {} }) => {
    if (!matchId || !user?.uid) return;
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

  const addMatch = (match) =>
    setMatches((prev) => {
      if (prev.find((m) => m.id === match.id)) return prev;
      return [...prev, match];
    });

  const removeMatch = (matchId) => setMatches((prev) => prev.filter((m) => m.id !== matchId));

  const removeMatchesWithUser = (uid) =>
    setMatches((prev) => prev.filter((m) => m.otherUserId !== uid));

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
          const presence = (m.presence && otherId && m.presence[otherId]) || {};
          return {
            id: m.id,
            otherUserId: otherId,
            displayName: prevMatch.displayName || 'Match',
            age: prevMatch.age || 0,
            image:
              prevMatch.image ||
              (presence.photoURL ? { uri: presence.photoURL } : require('../assets/user1.jpg')),
            avatarOverlay: prevMatch.avatarOverlay || presence.avatarOverlay || '',
            online: prevMatch.online || !!presence.online,
            messages: prevMatch.messages || [],
            matchedAt: m.createdAt ? m.createdAt.toDate?.().toISOString() : 'now',
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

  return (
    <MatchesContext.Provider
      value={{
        matches,
        loading,
        sendMessage,
        addMatch,
        removeMatch,
        removeMatchesWithUser,
        refreshMatches,
        loadMoreMatches,
        hasMoreMatches,
        setMatches,
      }}
    >
      {children}
    </MatchesContext.Provider>
  );
};

export const useMatches = () => useContext(MatchesContext);
