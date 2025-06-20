import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { collection, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from './UserContext';

const ListenerContext = createContext();

export const ListenerProvider = ({ children }) => {
  const { user } = useUser();

  const [messagesMap, setMessagesMap] = useState({});
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [outgoingInvites, setOutgoingInvites] = useState([]);
  const [sessions, setSessions] = useState([]);

  const messageUnsubs = useRef({});

  // Subscribe to match messages for current user
  useEffect(() => {
    if (!user?.uid) return;
    const matchQ = query(
      collection(db, 'matches'),
      where('users', 'array-contains', user.uid)
    );
    const unsubMatches = onSnapshot(matchQ, (snap) => {
      const ids = snap.docs.map((d) => d.id);
      // Clean up previous listeners
      Object.values(messageUnsubs.current).forEach((u) => u && u());
      messageUnsubs.current = {};
      ids.forEach((id) => {
        const q = query(
          collection(db, 'matches', id, 'messages'),
          orderBy('timestamp', 'asc')
        );
        messageUnsubs.current[id] = onSnapshot(q, (msgSnap) => {
          const msgs = msgSnap.docs.map((doc) => {
            const val = doc.data();
            return { id: doc.id, text: val.text, senderId: val.senderId };
          });
          setMessagesMap((prev) => ({ ...prev, [id]: msgs }));
        });
      });
    });
    return () => {
      unsubMatches();
      Object.values(messageUnsubs.current).forEach((u) => u && u());
      messageUnsubs.current = {};
    };
  }, [user?.uid]);

  // Subscribe to invites and match requests
  useEffect(() => {
    if (!user?.uid) return;
    const reqRef = collection(db, 'matchRequests');
    const outQ = query(reqRef, where('from', '==', user.uid));
    const inQ = query(reqRef, where('to', '==', user.uid));

    const unsubOut = onSnapshot(outQ, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOutgoingRequests(data);
    });

    const unsubIn = onSnapshot(inQ, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIncomingRequests(data);
    });

    const inviteRef = collection(db, 'gameInvites');
    const outInvQ = query(inviteRef, where('from', '==', user.uid));
    const inInvQ = query(inviteRef, where('to', '==', user.uid));

    const unsubOutInv = onSnapshot(outInvQ, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOutgoingInvites(data);
    });

    const unsubInInv = onSnapshot(inInvQ, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIncomingInvites(data);
    });

    return () => {
      unsubOut();
      unsubIn();
      unsubOutInv();
      unsubInInv();
    };
  }, [user?.uid]);

  // Subscribe to game sessions for current user
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

  const getMessages = (matchId) => messagesMap[matchId] || [];

  return (
    <ListenerContext.Provider
      value={{
        getMessages,
        incomingRequests,
        outgoingRequests,
        incomingInvites,
        outgoingInvites,
        sessions,
      }}
    >
      {children}
    </ListenerContext.Provider>
  );
};

export const useListeners = () => useContext(ListenerContext);
