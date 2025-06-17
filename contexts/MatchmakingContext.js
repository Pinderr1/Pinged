import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from './UserContext';

const MatchmakingContext = createContext();

export const MatchmakingProvider = ({ children }) => {
  const { user } = useUser();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [outgoingInvites, setOutgoingInvites] = useState([]);

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

  const sendMatchRequest = async (to) => {
    if (!user?.uid || !to) return null;
    const ref = await addDoc(collection(db, 'matchRequests'), {
      from: user.uid,
      to,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return ref.id;
  };

  const acceptMatchRequest = async (id) => {
    if (!user?.uid || !id) return;
    const ref = doc(db, 'matchRequests', id);
    const snap = await getDoc(ref);
    const data = snap.data();
    if (!snap.exists() || (data.from !== user.uid && data.to !== user.uid)) return;
    await updateDoc(ref, { status: 'accepted' });
  };

  const cancelMatchRequest = async (id) => {
    if (!user?.uid || !id) return;
    const ref = doc(db, 'matchRequests', id);
    const snap = await getDoc(ref);
    const data = snap.data();
    if (!snap.exists() || (data.from !== user.uid && data.to !== user.uid)) return;
    await updateDoc(ref, { status: 'cancelled' });
  };

  const sendGameInvite = async (to, gameId) => {
    if (!user?.uid || !to || !gameId) return null;
    const payload = {
      from: user.uid,
      to,
      gameId,
      fromName: user.displayName || 'User',
      status: 'pending',
      acceptedBy: [user.uid],
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'gameInvites'), payload);
    const inviteData = { ...payload, inviteId: ref.id };
    try {
      await setDoc(doc(db, 'users', user.uid, 'gameInvites', ref.id), inviteData);
      await setDoc(doc(db, 'users', to, 'gameInvites', ref.id), inviteData);
    } catch (e) {
      console.warn('Failed to create invite subdocs', e);
    }
    return ref.id;
  };

  const acceptGameInvite = async (id) => {
    if (!user?.uid || !id) return;
    const ref = doc(db, 'gameInvites', id);
    const snap = await getDoc(ref);
    const data = snap.data();
    if (!snap.exists() || (data.from !== user.uid && data.to !== user.uid)) return;
    await updateDoc(ref, { acceptedBy: arrayUnion(user.uid) });

    if (data.acceptedBy?.length + 1 >= 2 && !data.acceptedBy?.includes(user.uid)) {
      await updateDoc(ref, { status: 'ready' });
    } else if (data.acceptedBy?.length >= 2) {
      await updateDoc(ref, { status: 'ready' });
    }

    try {
      await updateDoc(doc(db, 'users', user.uid, 'gameInvites', id), {
        status: 'accepted',
      });
    } catch (e) {
      console.warn('Failed to update invite status', e);
    }
  };

  const cancelGameInvite = async (id) => {
    if (!user?.uid || !id) return;

    const ref = doc(db, 'gameInvites', id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();
    if (data.from !== user.uid && data.to !== user.uid) return;

    try {
      await updateDoc(ref, { status: 'cancelled' });

      await updateDoc(doc(db, 'users', user.uid, 'gameInvites', id), {
        status: 'cancelled',
      });
    } catch (e) {
      console.warn('Failed to cancel game invite', e);
    }
  };

  return (
    <MatchmakingContext.Provider
      value={{
        incomingRequests,
        outgoingRequests,
        incomingInvites,
        outgoingInvites,
        sendMatchRequest,
        acceptMatchRequest,
        cancelMatchRequest,
        sendGameInvite,
        acceptGameInvite,
        cancelGameInvite,
      }}
    >
      {children}
    </MatchmakingContext.Provider>
  );
};

export const useMatchmaking = () => useContext(MatchmakingContext);
