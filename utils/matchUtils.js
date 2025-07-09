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
  devMode = false,
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
  if (!targetUser) return false;

  if (likesUsed >= MAX_LIKES && !isPremiumUser && !devMode) {
    navigation.navigate('PremiumPaywall', { context: 'paywall' });
    return false;
  }

  setLikesUsed((prev) => prev + 1);
  showNotification(`You liked ${targetUser.displayName}`);

  if (currentUser?.uid && targetUser.id && !devMode) {
    try {
      await firestore
        .collection('likes')
        .doc(currentUser.uid)
        .collection('liked')
        .doc(targetUser.id)
        .set({ createdAt: firebase.firestore.FieldValue.serverTimestamp() });

      await firestore
        .collection('likes')
        .doc(targetUser.id)
        .collection('likedBy')
        .doc(currentUser.uid)
        .set({ createdAt: firebase.firestore.FieldValue.serverTimestamp() });

      const reciprocal = await firestore
        .collection('likes')
        .doc(targetUser.id)
        .collection('liked')
        .doc(currentUser.uid)
        .get();

      if (reciprocal.exists) {
        const matchRef = await firestore.collection('matches').add({
          users: [currentUser.uid, targetUser.id],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        addMatch({
          id: matchRef.id,
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
        return true;
      }
    } catch (e) {
      console.warn('Failed to process like', e);
      return false;
    }
  } else if (devMode) {
    addMatch({
      id: targetUser.id,
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
    setMatchGame(allGames[Math.floor(Math.random() * allGames.length)] || null);
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
    play('match');
    Toast.show({ type: 'success', text1: "It's a match!" });
    setShowFireworks(true);
    setTimeout(() => setShowFireworks(false), 2000);
    return true;
  }

  return true;
}
