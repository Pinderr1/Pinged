import React, { createContext, useContext } from 'react';
import firebase, { firestore } from '../firebase';
import { useUser } from './UserContext';
import { useListeners } from './ListenerContext';
import { snapshotExists } from '../utils/firestore';
import { validateMatch } from '../utils/matchUtils';
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
      const valid = await validateMatch(user.uid, to);
      if (!valid) {
        Toast.show({ type: 'error', text1: 'Match not found' });
        return null;
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
      const ref = await firebase
        .firestore()
        .collection('gameInvites')
        .add(payload);
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
      const snap = await firebase
        .firestore()
        .collection('gameInvites')
        .doc(id)
        .get();
      if (snapshotExists(snap)) {
        const data = snap.data();
        const opponentId = data.from === user.uid ? data.to : data.from;
        const matchId = [user.uid, opponentId].sort().join('_');
        const matchSnap = await firebase
          .firestore()
          .collection('matches')
          .doc(matchId)
          .get();
        if (!matchSnap.exists) {
          console.warn('Match doc missing for invite', id);
          Toast.show({ type: 'error', text1: 'Match not found' });
        }
      }
    } catch (e) {
      console.warn('Failed to accept game invite', e);
      Toast.show({ type: 'error', text1: 'Failed to accept invite' });
    } finally {
      hide();
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
        await ref.update({ status: 'cancelled' });
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
        cancelInvite,
      }}
    >
      {children}
    </MatchmakingContext.Provider>
  );
};

export const useMatchmaking = () => useContext(MatchmakingContext);
