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
      const eventSnap = await tx.get(eventRef);
      if (!eventSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Event does not exist');
      }

      const attendeeSnap = await tx.get(attendeeRef);
      if (attendeeSnap.exists) {
        throw new functions.https.HttpsError('already-exists', 'Already joined');
      }

      const userSnap = await tx.get(userRef);

      const eventData = eventSnap.data() || {};
      const userData = userSnap.data() || {};

      const hasTicket = Array.isArray(userData.eventTickets) && userData.eventTickets.includes(eventId);
      if (eventData.ticketed && !userData.isPremium && !hasTicket) {
        throw new functions.https.HttpsError('failed-precondition', 'Ticket required');
      }

      const capacity = Number(eventData.capacity) || null;
      const attendeeCount = Number(eventData.attendeeCount) || 0;
      if (capacity && attendeeCount >= capacity) {
        throw new functions.https.HttpsError('failed-precondition', 'Event is full');
      }

      tx.set(
        attendeeRef,
        { joinedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );
      tx.update(eventRef, {
        attendeeCount: admin.firestore.FieldValue.increment(1),
      });

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

const MAX_DAILY_EVENTS = 1;

const createEvent = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated',
    );
  }
  const title = data?.title;
  const time = data?.time;
  const description = data?.description || '';
  const category = data?.category || 'Tonight';
  if (!title || !time) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'title and time are required',
    );
  }

  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);
  const eventsRef = db.collection('events');

  try {
    return await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      const userData = userSnap.data() || {};
      const isPremium = !!userData.isPremium;

      let dailyCount = 0;
      if (!isPremium) {
        const last = userData.lastEventCreatedAt;
        const now = admin.firestore.Timestamp.now();
        if (
          last &&
          now.toDate().toDateString() === last.toDate().toDateString()
        ) {
          dailyCount = userData.dailyEventCount || 0;
        }
        if (dailyCount >= MAX_DAILY_EVENTS) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Daily event limit reached',
          );
        }
      }

      const eventRef = eventsRef.doc();
      tx.set(eventRef, {
        title,
        time,
        description,
        category,
        hostId: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (!isPremium) {
        dailyCount += 1;
        tx.update(userRef, {
          dailyEventCount: dailyCount,
          lastEventCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return { eventId: eventRef.id };
    });
  } catch (e) {
    if (e instanceof functions.https.HttpsError) {
      throw e;
    }
    console.error('createEvent failed', e);
    throw new functions.https.HttpsError('internal', 'Failed to create event');
  }
});

module.exports = { joinEvent, createEvent };
