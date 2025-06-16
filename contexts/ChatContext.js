import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  query,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useDev } from './DevContext';
import { useUser } from './UserContext';
import usePremiumStatus from '../hooks/usePremiumStatus';

const ChatContext = createContext();
const STORAGE_KEY = 'chatMatches';

export const ChatProvider = ({ children }) => {
  const { devMode } = useDev();
  const { user } = useUser();
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

  const [matches, setMatches] = useState(devMode ? [devMatch] : []);

  // Migrate old AsyncStorage matches into Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const migrate = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (!data) return;
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          await Promise.all(
            parsed.map(async (m) => {
              const ref = doc(db, 'users', user.uid, 'matches', m.id);
              await setDoc(ref, {
                name: m.name,
                age: m.age,
                image: m.image,
                activeGameId: m.activeGameId || null,
                pendingInvite: m.pendingInvite || null,
                createdAt: serverTimestamp(),
              }, { merge: true });

              const msgCol = collection(ref, 'messages');
              for (const msg of m.messages || []) {
                await addDoc(msgCol, {
                  text: msg.text,
                  sender: msg.sender,
                  createdAt: serverTimestamp(),
                });
              }
            })
          );
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        console.warn('Chat migration failed', e);
      }
    };
    migrate();
  }, [user?.uid]);

  // Listen for match list changes
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'users', user.uid, 'matches'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data(), messages: [] }));
      setMatches((prev) => {
        const filtered = prev.filter((m) => m.id === devMatch.id);
        return devMode ? [...data, ...filtered] : data;
      });
    });
    return unsub;
  }, [user?.uid, devMode]);

  // Live message sync for all matches
  const messageSubs = useRef({});
  useEffect(() => {
    if (!user?.uid) return;
    const ids = matches.filter((m) => m.id !== devMatch.id).map((m) => m.id);
    ids.forEach((id) => {
      if (!messageSubs.current[id]) {
        const mq = query(collection(db, 'users', user.uid, 'matches', id, 'messages'), orderBy('createdAt', 'asc'));
        messageSubs.current[id] = onSnapshot(mq, (snap) => {
          const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setMatches((prev) =>
            prev.map((m) => (m.id === id ? { ...m, messages: msgs } : m))
          );
        });
      }
    });
    Object.keys(messageSubs.current).forEach((id) => {
      if (!ids.includes(id)) {
        messageSubs.current[id]();
        delete messageSubs.current[id];
      }
    });
    return () => {
      Object.values(messageSubs.current).forEach((u) => u());
      messageSubs.current = {};
    };
  }, [user?.uid, matches.map((m) => m.id).join()]);

  useEffect(() => {
    setMatches((prev) => {
      if (devMode && !prev.find((m) => m.id === devMatch.id)) {
        return [...prev, devMatch];
      }
      return devMode ? prev : prev.filter((m) => m.id !== devMatch.id);
    });
  }, [devMode]);

  const sendMessage = async (matchId, text, sender = 'you', type = 'text') => {
    if (!user?.uid || !text) return;
    if (matchId === devMatch.id) {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                messages: [...m.messages, { id: Date.now().toString(), text, sender, type }],
              }
            : m
        )
      );
      return;
    }
    await addDoc(collection(db, 'users', user.uid, 'matches', matchId, 'messages'), {
      text,
      sender,
      type,
      createdAt: serverTimestamp(),
    });
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
    if (!user?.uid) return;
    updateDoc(doc(db, 'users', user.uid, 'matches', matchId), {
      activeGameId: gameId,
      pendingInvite: null,
    });
  };

  const sendGameInvite = async (matchId, gameId, from = 'you') => {
    if (!user?.uid) return;
    await updateDoc(doc(db, 'users', user.uid, 'matches', matchId), {
      pendingInvite: { gameId, from },
    });
  };

  const clearGameInvite = (matchId) => {
    if (!user?.uid) return;
    updateDoc(doc(db, 'users', user.uid, 'matches', matchId), {
      pendingInvite: null,
    });
  };

  const acceptGameInvite = (matchId) => {
    if (!user?.uid) return;
    const invite = matches.find((m) => m.id === matchId)?.pendingInvite;
    if (!invite) return;
    updateDoc(doc(db, 'users', user.uid, 'matches', matchId), {
      activeGameId: invite.gameId,
      pendingInvite: null,
    });
  };

  const getPendingInvite = (matchId) => matches.find((m) => m.id === matchId)?.pendingInvite || null;
  const getActiveGame = (matchId) => matches.find((m) => m.id === matchId)?.activeGameId || null;
  const getMessages = (matchId) => matches.find((m) => m.id === matchId)?.messages || [];

  const addMatch = async (match) => {
    if (!user?.uid || !match?.id) return;
    await setDoc(doc(db, 'users', user.uid, 'matches', match.id), {
      name: match.name,
      age: match.age,
      image: match.image,
      activeGameId: null,
      pendingInvite: null,
      createdAt: serverTimestamp(),
    }, { merge: true });
  };

  const removeMatch = (matchId) => {
    if (!user?.uid) return;
    deleteDoc(doc(db, 'users', user.uid, 'matches', matchId));
  };

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
