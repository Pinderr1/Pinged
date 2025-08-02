const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Scheduled function to purge sessions, matches, and related data older than 30 days
const purgeInactiveData = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const db = admin.firestore();
    const cutoff = admin.firestore.Timestamp.fromMillis(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    );

    // Helper to delete a batch of docs
    async function deleteDocs(query) {
      const snap = await query.get();
      await Promise.all(snap.docs.map((d) => d.ref.delete()));
    }

    // Cleanup game sessions and corresponding invites
    async function purgeSessions() {
      const seen = new Set();
      const sessions = await db
        .collection('gameSessions')
        .where('updatedAt', '<', cutoff)
        .get();
      const sessionsNoUpdate = await db
        .collection('gameSessions')
        .where('updatedAt', '==', null)
        .where('createdAt', '<', cutoff)
        .get();
      const all = sessions.docs.concat(sessionsNoUpdate.docs);
      await Promise.all(
        all.map(async (doc) => {
          if (seen.has(doc.id)) return null;
          seen.add(doc.id);
          await db.collection('gameInvites').doc(doc.id).delete().catch(() => {});
          return doc.ref.delete();
        }),
      );
    }

    // Cleanup matches and their messages
    async function purgeMatches() {
      const seen = new Set();
      const matches = await db
        .collection('matches')
        .where('lastMessageAt', '<', cutoff)
        .get();
      const matchesNoMsg = await db
        .collection('matches')
        .where('lastMessageAt', '==', null)
        .where('createdAt', '<', cutoff)
        .get();
      const all = matches.docs.concat(matchesNoMsg.docs);
      for (const doc of all) {
        if (seen.has(doc.id)) continue;
        seen.add(doc.id);
        const messages = await doc.ref.collection('messages').get();
        await Promise.all(messages.docs.map((m) => m.ref.delete()));
        await doc.ref.delete();
      }
    }

    // Remove standalone invites that are old
    async function purgeInvites() {
      await deleteDocs(
        db.collection('gameInvites').where('createdAt', '<', cutoff),
      );
    }

    await Promise.all([purgeSessions(), purgeMatches(), purgeInvites()]);
    return null;
  });

module.exports = { purgeInactiveData };
