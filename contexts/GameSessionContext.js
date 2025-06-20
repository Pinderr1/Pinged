import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from './UserContext';

const GameSessionContext = createContext();

export const GameSessionProvider = ({ children }) => {
  const { user } = useUser();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'gameSessions'),
      where('players', 'array-contains', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSessions(data);
    });
    return unsub;
  }, [user?.uid]);

  return (
    <GameSessionContext.Provider value={{ sessions }}>
      {children}
    </GameSessionContext.Provider>
  );
};

export const useGameSessions = () => useContext(GameSessionContext);
