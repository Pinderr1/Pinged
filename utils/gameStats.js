import { db } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';
import { snapshotExists } from './firestore';

export async function logGameStats(sessionId) {
  if (!sessionId) return;
  try {
    const ref = db.collection('gameSessions').doc(sessionId);
    const snap = await ref.get();
    if (!snapshotExists(snap)) return;
    const data = snap.data() || {};
    if (!data.gameover) return;

    const created = data.createdAt?.toDate?.() || data.createdAt;
    const updated = data.updatedAt?.toDate?.() || new Date();
    const duration = created && updated ? Math.round((updated - created) / 1000) : 0;
    const players = data.players || [];
    let winner = null;
    if (data.gameover.winner != null && players[data.gameover.winner]) {
      winner = players[data.gameover.winner];
    }

    await db
      .collection('gameStats')
      .doc(sessionId)
      .set({
        gameId: data.gameId,
        players,
        durationSec: duration,
        winner,
        moves: data.moves || [],
        loggedAt: serverTimestamp(),
      });
  } catch (e) {
    console.warn('Failed to log game stats', e);
  }
}
