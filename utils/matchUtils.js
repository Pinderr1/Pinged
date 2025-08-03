import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import firebase from '../firebase';
import { icebreakers } from '../data/prompts';
import { allGames } from '../data/games';
import { snapshotExists } from './firestore';

export async function validateMatch(uid, otherUid) {
  if (!uid || !otherUid) return false;
  try {
    const sorted = [uid, otherUid].sort();
    const matchId = sorted.join('_');
    const snap = await firebase
      .firestore()
      .collection('matches')
      .doc(matchId)
      .get();
    const data = snap.data() || {};
    return (
      snapshotExists(snap) &&
      Array.isArray(data.users) &&
      data.users.includes(uid) &&
      data.users.includes(otherUid)
    );
  } catch (e) {
    console.warn('Failed to validate match', e);
  }
  return false;
}

export async function handleLike({
  currentUser,
  targetUser,
  firestore,
  navigation,
  isPremiumUser = false,
  showNotification = () => {},
  addMatch = () => {},
  setMatchedUser = () => {},
  setMatchLine = () => {},
  setMatchGame = () => {},
  play = () => {},
  setShowFireworks = () => {},
}) {
  if (!targetUser) return { success: false, matchId: null };

  if (currentUser?.uid && targetUser.id) {
    try {
      const res = await firebase
        .functions()
        .httpsCallable('sendLike')({
          uid: currentUser.uid,
          targetUid: targetUser.id,
        });

      const matchId = res?.data?.matchId || null;

      showNotification(`You liked ${targetUser.displayName}`);

      if (matchId) {
        addMatch({
          id: matchId,
          displayName: targetUser.displayName,
          age: targetUser.age,
          image: targetUser.images[0],
          messages: [],
          matchedAt: 'now',
          activeGameId: null,
          pendingInvite: null,
        });

        setMatchedUser(targetUser);
        setMatchLine(
          icebreakers[Math.floor(Math.random() * icebreakers.length)] || ''
        );
        setMatchGame(
          allGames[Math.floor(Math.random() * allGames.length)] || null
        );
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
        play('match');
        Toast.show({ type: 'success', text1: "It's a match!" });
        showNotification("It's a match!");
        setShowFireworks(true);
        setTimeout(() => setShowFireworks(false), 2000);
      } else {
        Toast.show({ type: 'success', text1: 'Like sent!' });
      }

      return { success: true, matchId };
    } catch (e) {
      if (!isPremiumUser && e?.message?.includes('Daily like limit')) {
        navigation.navigate('PremiumPaywall', { context: 'like-limit' });
        return { success: false, matchId: null };
      }
      console.error('Failed to process like', e);
      throw e;
    }
  }

  return { success: false, matchId: null };
}
