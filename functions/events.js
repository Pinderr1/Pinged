const functions = require('firebase-functions');
const admin = require('firebase-admin');

const joinEvent = functions.https.onCall(async (data, context) => {
  const eventId = data?.eventId;
  const uid = context.auth?.uid;

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!eventId) {
    throw new functions.https.HttpsError('invalid-argument', 'eventId is required');
  }

  const db = admin.firestore();
  const eventRef = db.collection('events').doc(eventId);
  const attendeeRef = eventRef.collection('attendees').doc(uid);
  const userRef = db.collection('users').doc(uid);

  try {
    return await db.runTransaction(async (tx) => {
      const [eventSnap, attendeeSnap, userSnap] = await Promise.all([
        tx.get(eventRef),
        tx.get(attendeeRef),
        tx.get(userRef),
      ]);

      if (!eventSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Event does not exist');
      }
      if (attendeeSnap.exists) {
        throw new functions.https.HttpsError('already-exists', 'Already joined');
      }

      const eventData = eventSnap.data() || {};
      const userData = userSnap.data() || {};

      if (eventData.ticketed && !userData.isPremium && !(userData.eventTickets || []).includes(eventId)) {
        throw new functions.https.HttpsError('failed-precondition', 'Ticket required');
      }

      const capacity = Number(eventData.capacity) || null;
      if (capacity) {
        const attendeesSnap = await tx.get(eventRef.collection('attendees'));
        if (attendeesSnap.size >= capacity) {
          throw new functions.https.HttpsError('failed-precondition', 'Event is full');
        }
      }

      tx.set(attendeeRef, { joinedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

      return { success: true };
    });
  } catch (e) {
    if (e instanceof functions.https.HttpsError) {
      throw e;
    }
    console.error('joinEvent failed', e);
    throw new functions.https.HttpsError('internal', 'Failed to join event');
  }
});

module.exports = { joinEvent };
