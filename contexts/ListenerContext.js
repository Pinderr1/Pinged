import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import firebase from '../firebase';
import { useUser } from './UserContext';
import { useNotification } from './NotificationContext';

const ListenerContext = createContext();

export const ListenerProvider = ({ children }) => {
  const { user } = useUser();
  const { showNotification } = useNotification();

  const [messagesMap, setMessagesMap] = useState({});
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [outgoingInvites, setOutgoingInvites] = useState([]);
  const [sessions, setSessions] = useState([]);

  const messageUnsubs = useRef({});
  const prevInvites = useRef([]);

  // Subscribe to match messages for current user
  useEffect(() => {
    if (!user?.uid) return;
    const matchQ = firebase
      .firestore()
      .collection('matches')
      .where('users', 'array-contains', user.uid);
    const unsubMatches = matchQ.onSnapshot((snap) => {
      const ids = snap.docs.map((d) => d.id);
      // Clean up previous listeners
      Object.values(messageUnsubs.current).forEach((u) => u && u());
      messageUnsubs.current = {};
      ids.forEach((id) => {
        const q = firebase
          .firestore()
          .collection('matches')
          .doc(id)
          .collection('messages')
          .orderBy('timestamp', 'asc');
        messageUnsubs.current[id] = q.onSnapshot((msgSnap) => {
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

  useEffect(() => {
    if (incomingInvites.length > prevInvites.current.length) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
      // TODO: play success sound here
      showNotification('New game invite');
    }
    prevInvites.current = incomingInvites;
  }, [incomingInvites]);

  // Subscribe to invites and match requests
  useEffect(() => {
    if (!user?.uid) return;
    const reqRef = firebase.firestore().collection('matchRequests');
    const outQ = reqRef.where('from', '==', user.uid);
    const inQ = reqRef.where('to', '==', user.uid);

    const unsubOut = outQ.onSnapshot((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOutgoingRequests(data);
    });

    const unsubIn = inQ.onSnapshot((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIncomingRequests(data);
    });

    const inviteRef = firebase.firestore().collection('gameInvites');
    const outInvQ = inviteRef.where('from', '==', user.uid);
    const inInvQ = inviteRef.where('to', '==', user.uid);

    const unsubOutInv = outInvQ.onSnapshot((snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOutgoingInvites(data);
    });

    const unsubInInv = inInvQ.onSnapshot((snap) => {
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
    const q = firebase
      .firestore()
      .collection('gameSessions')
      .where('players', 'array-contains', user.uid);
    const unsub = q.onSnapshot((snap) => {
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
