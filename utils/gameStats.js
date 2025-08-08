import firebase from '../firebase';
import { snapshotExists } from './firestore';

export async function logGameStats(sessionId) {
  if (!sessionId) return;
  try {
    const ref = firebase.firestore().collection('gameSessions').doc(sessionId);
    const snap = await ref.get();
    if (!snapshotExists(snap)) return;
    const data = snap.data() || {};
    if (!data.gameover) return;

    const movesSnap = await ref.collection('moves').orderBy('at').get();
    const moves = movesSnap.docs.map((d) => d.data() || {});

    const created = data.createdAt?.toDate?.() || data.createdAt;
    const updated = data.updatedAt?.toDate?.() || new Date();
    const duration = created && updated ? Math.round((updated - created) / 1000) : 0;
    const players = data.players || [];
    let winner = null;
    if (data.gameover.winner != null && players[data.gameover.winner]) {
      winner = players[data.gameover.winner];
    }

    await firebase
      .firestore()
      .collection('gameStats')
      .doc(sessionId)
      .set({
        gameId: data.gameId,
        players,
        durationSec: duration,
        winner,
        moves,
        loggedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
  } catch (e) {
    console.error('Failed to log game stats', e);
  }
}
