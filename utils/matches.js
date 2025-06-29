import { db, firebase } from '../firebase';

export async function createMatchIfMissing(uid, otherUid) {
  if (!uid || !otherUid) return null;
  try {
    const q = await db
      .collection('matches')
      .where('users', 'array-contains', uid)
      .get();
    const exists = q.docs.some((d) => (d.data().users || []).includes(otherUid));
    if (!exists) {
      const ref = await db.collection('matches').add({
        users: [uid, otherUid],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      return ref.id;
    }
  } catch (e) {
    console.warn('Failed to ensure match document', e);
  }
  return null;
}
