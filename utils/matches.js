import firebase from "../firebase";
import * as Analytics from "./analytics";

export async function createMatchIfMissing(uid, otherUid) {
  if (!uid || !otherUid) return null;
  try {
    const res = await firebase
      .functions()
      .httpsCallable("createMatch")({ opponentUid: otherUid });
    const matchId = res?.data?.matchId || [uid, otherUid].sort().join("_");
    await Analytics.logEvent("match_created");
    return matchId;
  } catch (e) {
    console.warn("Failed to ensure match document", e);
  }
  return null;
}
