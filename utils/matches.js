import firebase from "../firebase";
import * as Analytics from "expo-firebase-analytics";

export async function createMatchIfMissing(uid, otherUid) {
  if (!uid || !otherUid) return null;
  try {
    const q = await firebase
      .firestore()
      .collection("matches")
      .where("users", "array-contains", uid)
      .get();
    const exists = q.docs.some((d) =>
      (d.data().users || []).includes(otherUid),
    );
    if (!exists) {
      const ref = await firebase
        .firestore()
        .collection("matches")
        .add({
          users: [uid, otherUid],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      await Analytics.logEvent("match_created");
      return ref.id;
    }
  } catch (e) {
    console.warn("Failed to ensure match document", e);
  }
  return null;
}
