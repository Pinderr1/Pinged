import firebase from "../firebase";
import * as Analytics from "./analytics";

export async function createMatchIfMissing(uid, otherUid) {
  if (!uid || !otherUid) return null;
  const sorted = [uid, otherUid].sort();
  const matchId = sorted.join("_");
  try {
    const ref = firebase.firestore().collection("matches").doc(matchId);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        users: sorted,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      await Analytics.logEvent("match_created");
    }
    return matchId;
  } catch (e) {
    console.warn("Failed to ensure match document", e);
  }
  return null;
}
