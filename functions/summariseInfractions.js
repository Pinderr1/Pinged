const functions = require('firebase-functions');
const admin = require('firebase-admin');

const summariseInfractions = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const db = admin.firestore();
    const sessionsSnap = await db.collection('gameSessions').get();

    for (const doc of sessionsSnap.docs) {
      const data = doc.data() || {};
      const infractions = Array.isArray(data.infractions) ? data.infractions : [];
      if (infractions.length === 0) continue;

      const summary = {};
      infractions.forEach((inf) => {
        const player = inf.player || 'unknown';
        if (!summary[player]) {
          summary[player] = { count: 0, reasons: [], timestamps: [] };
        }
        summary[player].count += 1;
        if (inf.reason) summary[player].reasons.push(inf.reason);
        if (inf.at) summary[player].timestamps.push(inf.at);
      });

      await db.collection('infractionSummaries').doc(doc.id).set({
        sessionId: doc.id,
        players: summary,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await doc.ref.update({ infractions: [] });
    }

    return null;
  });

module.exports = { summariseInfractions };
