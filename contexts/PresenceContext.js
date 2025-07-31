import React, { createContext, useContext, useEffect, useRef } from 'react';
import create from 'zustand';
import firebase from '../firebase';
import { useUser } from './UserContext';
import { useMatches } from './MatchesContext';

const usePresenceStore = create((set) => ({
  presence: {},
  setPresence: (uid, info) =>
    set((state) => ({ presence: { ...state.presence, [uid]: info } })),
}));

const PresenceContext = createContext(usePresenceStore);

export const PresenceProvider = ({ children }) => {
  const { user } = useUser();
  const { matches } = useMatches();
  const setPresence = usePresenceStore((s) => s.setPresence);
  const userUnsubs = useRef({});

  useEffect(() => {
    const topFive = [...matches]
      .sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime())
      .slice(0, 5);
    const userIds = topFive.map((m) => m.otherUserId).filter(Boolean);

    Object.keys(userUnsubs.current).forEach((uid) => {
      if (!userIds.includes(uid)) {
        userUnsubs.current[uid]();
        delete userUnsubs.current[uid];
      }
    });

    userIds.forEach((uid) => {
      if (!userUnsubs.current[uid]) {
        const unsub = firebase
          .firestore()
          .collection('users')
          .doc(uid)
          .onSnapshot({ includeMetadataChanges: true }, (doc) => {
            const info = doc.data() || {};
            setPresence(uid, info);
          });
        userUnsubs.current[uid] = unsub;
      }
    });

    return () => {
      Object.values(userUnsubs.current).forEach((fn) => fn && fn());
      userUnsubs.current = {};
    };
  }, [user?.uid, matches, setPresence]);

  return (
    <PresenceContext.Provider value={{ useStore: usePresenceStore }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => {
  const ctx = useContext(PresenceContext);
  const store = ctx?.useStore || usePresenceStore;
  return {
    presence: store((s) => s.presence),
  };
};
