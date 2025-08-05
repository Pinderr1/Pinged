const functions = require('firebase-functions');
const admin = require('firebase-admin');

const MAX_MESSAGES = 50; // keep latest N messages live
const MAX_MESSAGE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const archiveOldMessages = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const db = admin.firestore();
    const cutoff = admin.firestore.Timestamp.fromMillis(
      Date.now() - MAX_MESSAGE_AGE_MS,
    );

    const matchesSnap = await db.collection('matches').get();

    for (const match of matchesSnap.docs) {
      const messagesRef = match.ref.collection('messages');
      // fetch newest messages to keep
      const recentSnap = await messagesRef
        .orderBy('timestamp', 'desc')
        .limit(MAX_MESSAGES)
        .get();
      const keepIds = new Set(recentSnap.docs.map((d) => d.id));
      const lastKept = recentSnap.docs[recentSnap.docs.length - 1];

      const oldByCountSnap = lastKept
        ? await messagesRef
            .orderBy('timestamp', 'desc')
            .startAfter(lastKept)
            .get()
        : { docs: [] };

      const oldByAgeSnap = await messagesRef
        .where('timestamp', '<', cutoff)
        .get();

      const map = new Map();
      oldByCountSnap.docs.forEach((d) => {
        if (!keepIds.has(d.id)) map.set(d.id, d);
      });
      oldByAgeSnap.docs.forEach((d) => {
        if (!keepIds.has(d.id)) map.set(d.id, d);
      });

      const toArchive = Array.from(map.values());
      if (toArchive.length === 0) continue;

      const batch = db.batch();
      toArchive.forEach((doc) => {
        const archiveRef = match.ref
          .collection('messages_archive')
          .doc(doc.id);
        batch.set(archiveRef, doc.data());
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
    return null;
  });

module.exports = { archiveOldMessages };

