import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import firebase from '../firebase';
import { icebreakers } from '../data/prompts';
import { allGames } from '../data/games';

export async function handleLike({
  currentUser,
  targetUser,
  firestore,
  navigation,
  likesUsed = 0,
  isPremiumUser = false,
  setLikesUsed = () => {},
  showNotification = () => {},
  addMatch = () => {},
  setMatchedUser = () => {},
  setMatchLine = () => {},
  setMatchGame = () => {},
  play = () => {},
  setShowFireworks = () => {},
  MAX_LIKES = 100,
}) {
  if (!targetUser) return { success: false, matchId: null };

  if (likesUsed >= MAX_LIKES && !isPremiumUser) {
    navigation.navigate('PremiumPaywall', { context: 'paywall' });
    return { success: false, matchId: null };
  }

  if (currentUser?.uid && targetUser.id) {
    try {
      await firestore
        .collection('likes')
        .doc(currentUser.uid)
        .collection('liked')
        .doc(targetUser.id)
        .set({ createdAt: firebase.firestore.FieldValue.serverTimestamp() });

      const res = await firebase
        .functions()
        .httpsCallable('createMatchIfMutualLike')({
          uid: currentUser.uid,
          targetUid: targetUser.id,
        });

      const matchId = res?.data?.matchId || null;

      setLikesUsed((prev) => prev + 1);
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
      console.error('Failed to process like', e);
      throw e;
    }
  }

  return { success: false, matchId: null };
}
