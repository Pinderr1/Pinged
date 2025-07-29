import React, { createContext, useContext } from 'react';
import firebase, { firestore } from '../firebase';
import { useUser } from './UserContext';
import { useListeners } from './ListenerContext';
import { snapshotExists } from '../utils/firestore';
import Toast from 'react-native-toast-message';
import { useLoading } from './LoadingContext';

const MatchmakingContext = createContext();

export const MatchmakingProvider = ({ children }) => {
  const { user } = useUser();
  const { show, hide } = useLoading();
  const { incomingInvites, outgoingInvites } = useListeners();


  const sendGameInvite = async (to, gameId) => {
    if (!user?.uid || !to || !gameId) return null;
    show();
    try {
      const inviteRef = firebase.firestore().collection('gameInvites');
      const statuses = ['pending', 'ready', 'active'];

      const q1 = inviteRef
        .where('from', '==', user.uid)
        .where('to', '==', to)
        .where('gameId', '==', gameId)
        .where('status', 'in', statuses)
        .limit(1);
      const q2 = inviteRef
        .where('from', '==', to)
        .where('to', '==', user.uid)
        .where('gameId', '==', gameId)
        .where('status', 'in', statuses)
        .limit(1);

      const [s1, s2] = await Promise.all([q1.get(), q2.get()]);
      const existing = !s1.empty ? s1.docs[0] : !s2.empty ? s2.docs[0] : null;
      if (existing) {
        return existing.id;
      }

      const payload = {
        from: user.uid,
        to,
        gameId,
        fromName: user.displayName || 'User',
        status: 'pending',
        acceptedBy: [user.uid],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      const ref = await inviteRef.add(payload);
      return ref.id;
    } catch (e) {
      console.warn('Failed to send game invite', e);
      Toast.show({ type: 'error', text1: 'Failed to send game invite' });
      return null;
    } finally {
      hide();
    }
  };

  const acceptGameInvite = async (id) => {
    if (!user?.uid || !id) return;
    try {
      show();
      await firebase.functions().httpsCallable('acceptInvite')({ inviteId: id });
    } catch (e) {
      console.warn('Failed to accept game invite', e);
      Toast.show({ type: 'error', text1: 'Failed to accept invite' });
    } finally {
      hide();
    }
  };

  const cancelGameInvite = async (id) => {
    if (!user?.uid || !id) return;

    try {
      const ref = firebase.firestore().collection('gameInvites').doc(id);
      const snap = await ref.get();

      if (!snapshotExists(snap)) return;

      const data = snap.data();
      if (data.from !== user.uid && data.to !== user.uid) return;

      try {
        await ref.update({ status: 'cancelled' });
      } catch (e) {
        console.warn('Failed to cancel game invite', e);
        Toast.show({ type: 'error', text1: 'Failed to cancel invite' });
      }
    } catch (e) {
      console.warn('Failed to load game invite', e);
      Toast.show({ type: 'error', text1: 'Failed to cancel invite' });
    }
  };

  const cancelInvite = async (id) => {
    if (!user?.uid || !id) return;

    try {
      const ref = firebase.firestore().collection('gameInvites').doc(id);
      const snap = await ref.get();

      if (!snapshotExists(snap)) return;

      const data = snap.data();
      if (data.from !== user.uid && data.to !== user.uid) return;

      try {
        await ref.delete();
      } catch (e) {
        console.warn('Failed to cancel invite', e);
        Toast.show({ type: 'error', text1: 'Failed to cancel invite' });
      }
    } catch (e) {
      console.warn('Failed to load game invite', e);
      Toast.show({ type: 'error', text1: 'Failed to cancel invite' });
    }
  };

  return (
    <MatchmakingContext.Provider
      value={{
        incomingInvites,
        outgoingInvites,
        sendGameInvite,
        acceptGameInvite,
        cancelGameInvite,
        cancelInvite,
      }}
    >
      {children}
    </MatchmakingContext.Provider>
  );
};

export const useMatchmaking = () => useContext(MatchmakingContext);
