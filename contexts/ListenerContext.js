import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import firebase from '../firebase';
import { useUser } from './UserContext';
import { useNotification } from './NotificationContext';
import { useSound } from './SoundContext';

const MATCH_PAGE_SIZE = 20;

const ListenerContext = createContext();

export const ListenerProvider = ({ children }) => {
  const { user } = useUser();
  const { showNotification } = useNotification();
  const { play } = useSound();

  const [messageInfoMap, setMessageInfoMap] = useState({});
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [outgoingInvites, setOutgoingInvites] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [lastMatchDoc, setLastMatchDoc] = useState(null);
  const [hasMoreMatches, setHasMoreMatches] = useState(true);

  const prevInvites = useRef([]);
  const prevMatches = useRef([]);
  const prevInfoMap = useRef({});

  // Subscribe to match metadata for current user
  useEffect(() => {
    if (!user?.uid) return;
    const matchQ = firebase
      .firestore()
      .collection('matches')
      .where('users', 'array-contains', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(MATCH_PAGE_SIZE);

    const unsubMatches = matchQ.onSnapshot((snap) => {
      const ids = snap.docs.map((d) => d.id);

      if (prevMatches.current.length) {
        const newMatchIds = ids.filter((id) => !prevMatches.current.includes(id));
        if (newMatchIds.length > 0) {
          showNotification('New Match!');
        }
      }
      prevMatches.current = ids;

      setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLastMatchDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMoreMatches(snap.docs.length === MATCH_PAGE_SIZE);

      const infoMap = {};
      snap.docs.forEach((doc) => {
        const id = doc.id;
        const data = doc.data() || {};
        const info = {
          matchId: id,
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

        infoMap[id] = info;
      });

      prevInfoMap.current = infoMap;
      setMessageInfoMap(infoMap);
    });

    return () => {
      unsubMatches();
      prevMatches.current = [];
      prevInfoMap.current = {};
      setMatches([]);
      setMessageInfoMap({});
    };
  }, [user?.uid]);

  useEffect(() => {
    if (incomingInvites.length > prevInvites.current.length) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
      play('match');
      showNotification('New game invite');
    }
    prevInvites.current = incomingInvites;
  }, [incomingInvites]);

  // Subscribe to game invites
  useEffect(() => {
    if (!user?.uid) return;
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

  const loadMoreMatches = async () => {
    if (!user?.uid || !hasMoreMatches || !lastMatchDoc) return;
    try {
      const snap = await firebase
        .firestore()
        .collection('matches')
        .where('users', 'array-contains', user.uid)
        .orderBy('createdAt', 'desc')
        .startAfter(lastMatchDoc)
        .limit(MATCH_PAGE_SIZE)
        .get();
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMatches((prev) => [...prev, ...data]);
      setLastMatchDoc(snap.docs[snap.docs.length - 1] || lastMatchDoc);
      setHasMoreMatches(snap.docs.length === MATCH_PAGE_SIZE);
    } catch (e) {
      console.warn('Failed to load more matches', e);
    }
  };

  return (
    <ListenerContext.Provider
      value={{
        matches,
        sessions,
        incomingInvites,
        outgoingInvites,
        messageInfoMap,
        loadMoreMatches,
        hasMoreMatches,
        getMatchInfo,
      }}
    >
      {children}
    </ListenerContext.Provider>
  );
};

export const useListeners = () => useContext(ListenerContext);
