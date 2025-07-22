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
  const {
    incomingRequests,
    outgoingRequests,
    incomingInvites,
    outgoingInvites,
  } = useListeners();

  const sendMatchRequest = async (to) => {
    if (!user?.uid || !to) return null;
    try {
      const ref = await firebase
        .firestore()
        .collection('matchRequests')
        .add({
          from: user.uid,
          to,
          status: 'pending',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      return ref.id;
    } catch (e) {
      console.warn('Failed to send match request', e);
      Toast.show({ type: 'error', text1: 'Failed to send match request' });
      return null;
    }
  };

  const acceptMatchRequest = async (id) => {
    if (!user?.uid || !id) return;
    try {
      const ref = firebase.firestore().collection('matchRequests').doc(id);
      const snap = await ref.get();
      const data = snap.data();
      if (!snapshotExists(snap) || (data.from !== user.uid && data.to !== user.uid)) return;
      await ref.update({ status: 'accepted' });
    } catch (e) {
      console.warn('Failed to accept match request', e);
      Toast.show({ type: 'error', text1: 'Failed to accept request' });
    }
  };

  const cancelMatchRequest = async (id) => {
    if (!user?.uid || !id) return;
    try {
      const ref = firebase.firestore().collection('matchRequests').doc(id);
      const snap = await ref.get();
      const data = snap.data();
      if (!snapshotExists(snap) || (data.from !== user.uid && data.to !== user.uid)) return;
      await ref.update({ status: 'cancelled' });
    } catch (e) {
      console.warn('Failed to cancel match request', e);
      Toast.show({ type: 'error', text1: 'Failed to cancel request' });
    }
  };

  const sendGameInvite = async (to, gameId) => {
    if (!user?.uid || !to || !gameId) return null;
    show();
    try {
      const payload = {
        from: user.uid,
        to,
        gameId,
        fromName: user.displayName || 'User',
        status: 'pending',
        acceptedBy: [user.uid],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };
      const ref = await firebase
        .firestore()
        .collection('gameInvites')
        .add(payload);
      const inviteData = { ...payload, inviteId: ref.id };
      try {
        await firestore
          .collection('users')
          .doc(user.uid)
          .collection('gameInvites')
          .doc(ref.id)
          .set(inviteData);
        await firestore
          .collection('users')
          .doc(to)
          .collection('gameInvites')
          .doc(ref.id)
          .set(inviteData);
      } catch (e) {
        console.warn('Failed to create invite subdocs', e);
      }
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

        await firebase
          .firestore()
          .collection('users')
          .doc(user.uid)
          .collection('gameInvites')
          .doc(id)
          .update({ status: 'cancelled' });
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

        await firebase
          .firestore()
          .collection('users')
          .doc(data.from)
          .collection('gameInvites')
          .doc(id)
          .delete()
          .catch(() => {});

        await firebase
          .firestore()
          .collection('users')
          .doc(data.to)
          .collection('gameInvites')
          .doc(id)
          .delete()
          .catch(() => {});
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
        cancelInvite,
      }}
    >
      {children}
    </MatchmakingContext.Provider>
  );
};

export const useMatchmaking = () => useContext(MatchmakingContext);
