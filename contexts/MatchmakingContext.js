import React, { createContext, useContext } from 'react';
import { db, firebase } from '../firebase';
import { useUser } from './UserContext';
import { useListeners } from './ListenerContext';
import { snapshotExists } from '../utils/firestore';
import { createMatchIfMissing } from '../utils/matches';

const MatchmakingContext = createContext();

export const MatchmakingProvider = ({ children }) => {
  const { user } = useUser();
  const {
    incomingRequests,
    outgoingRequests,
    incomingInvites,
    outgoingInvites,
  } = useListeners();

  const sendMatchRequest = async (to) => {
    if (!user?.uid || !to) return null;
    const ref = await db.collection('matchRequests').add({
      from: user.uid,
      to,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return ref.id;
  };

  const acceptMatchRequest = async (id) => {
    if (!user?.uid || !id) return;
    const ref = db.collection('matchRequests').doc(id);
    const snap = await ref.get();
    const data = snap.data();
    if (!snapshotExists(snap) || (data.from !== user.uid && data.to !== user.uid)) return;
    await ref.update({ status: 'accepted' });
  };

  const cancelMatchRequest = async (id) => {
    if (!user?.uid || !id) return;
    const ref = db.collection('matchRequests').doc(id);
    const snap = await ref.get();
    const data = snap.data();
    if (!snapshotExists(snap) || (data.from !== user.uid && data.to !== user.uid)) return;
    await ref.update({ status: 'cancelled' });
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
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await db.collection('gameInvites').add(payload);
    const inviteData = { ...payload, inviteId: ref.id };
    try {
      await db
        .collection('users')
        .doc(user.uid)
        .collection('gameInvites')
        .doc(ref.id)
        .set(inviteData);
      await db
        .collection('users')
        .doc(to)
        .collection('gameInvites')
        .doc(ref.id)
        .set(inviteData);
    } catch (e) {
      console.warn('Failed to create invite subdocs', e);
    }
    return ref.id;
  };

  const acceptGameInvite = async (id) => {
    if (!user?.uid || !id) return;
    const ref = db.collection('gameInvites').doc(id);
    const snap = await ref.get();
    const data = snap.data();
    if (!snapshotExists(snap) || (data.from !== user.uid && data.to !== user.uid)) return;
    await ref.update({
      acceptedBy: firebase.firestore.FieldValue.arrayUnion(user.uid),
    });

    if (data.acceptedBy?.length + 1 >= 2 && !data.acceptedBy?.includes(user.uid)) {
      await ref.update({ status: 'ready' });
    } else if (data.acceptedBy?.length >= 2) {
      await ref.update({ status: 'ready' });
    }

    try {
      await db
        .collection('users')
        .doc(user.uid)
        .collection('gameInvites')
        .doc(id)
        .update({ status: 'accepted' });
    } catch (e) {
      console.warn('Failed to update invite status', e);
    }

    await createMatchIfMissing(user.uid, data.from === user.uid ? data.to : data.from);
  };

  const cancelGameInvite = async (id) => {
    if (!user?.uid || !id) return;

    const ref = db.collection('gameInvites').doc(id);
    const snap = await ref.get();

    if (!snapshotExists(snap)) return;

    const data = snap.data();
    if (data.from !== user.uid && data.to !== user.uid) return;

    try {
      await ref.update({ status: 'cancelled' });

      await db
        .collection('users')
        .doc(user.uid)
        .collection('gameInvites')
        .doc(id)
        .update({ status: 'cancelled' });
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
