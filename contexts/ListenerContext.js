import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import firebase from '../firebase';
import { useUser } from './UserContext';
import { useNotification } from './NotificationContext';

const ListenerContext = createContext();

export const ListenerProvider = ({ children }) => {
  const { user } = useUser();
  const { showNotification } = useNotification();

  const [messageInfoMap, setMessageInfoMap] = useState({});
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [outgoingInvites, setOutgoingInvites] = useState([]);
  const [sessions, setSessions] = useState([]);

  const messageUnsubs = useRef({});
  const prevInvites = useRef([]);
  const prevMatches = useRef([]);
  const prevInfoMap = useRef({});

  // Subscribe to match metadata for current user
  useEffect(() => {
    if (!user?.uid) return;
    const matchQ = firebase
      .firestore()
      .collection('matches')
      .where('users', 'array-contains', user.uid);
    const unsubMatches = matchQ.onSnapshot((snap) => {
      const ids = snap.docs.map((d) => d.id);

      if (prevMatches.current.length) {
        const newMatchIds = ids.filter((id) => !prevMatches.current.includes(id));
        if (newMatchIds.length > 0) {
          showNotification('New Match!');
        }
      }
      prevMatches.current = ids;

      // Clean up previous listeners
      Object.values(messageUnsubs.current).forEach((u) => u && u());
      messageUnsubs.current = {};

      snap.docs.forEach((d) => {
        const id = d.id;

        if (!prevInfoMap.current[id]) {
          prevInfoMap.current[id] = { lastMessage: '', unreadCount: 0 };
        }

        messageUnsubs.current[id] = firebase
          .firestore()
          .collection('matches')
          .doc(id)
          .onSnapshot((doc) => {
            const data = doc.data() || {};
            const info = {
              lastMessage: data.lastMessage || '',
              unreadCount: data.unreadCounts?.[user.uid] || 0,
            };

            const prevInfo = prevInfoMap.current[id];
            if (
              prevInfo &&
              info.unreadCount > prevInfo.unreadCount &&
              data.lastSenderId &&
              data.lastSenderId !== user.uid
            ) {
              showNotification('New Message');
            }

            prevInfoMap.current[id] = info;
            setMessageInfoMap((prev) => ({
              ...prev,
              [id]: { matchId: id, ...info },
            }));
          });
      });
    });
    return () => {
      unsubMatches();
      Object.values(messageUnsubs.current).forEach((u) => u && u());
      messageUnsubs.current = {};
      prevMatches.current = [];
      prevInfoMap.current = {};
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

  const getMatchInfo = (matchId) => messageInfoMap[matchId] || { lastMessage: '', unreadCount: 0 };

  return (
    <ListenerContext.Provider
      value={{
        getMatchInfo,
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
