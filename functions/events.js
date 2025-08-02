const functions = require('firebase-functions');
const admin = require('firebase-admin');

const MAX_JOINS_PER_MINUTE = 5;
const SPAM_BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

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
  const attemptRef = db.collection('joinAttempts').doc(uid);

  const now = admin.firestore.Timestamp.now();
  let blocked = false;

  try {
    await db.runTransaction(async (tx) => {
      const attemptSnap = await tx.get(attemptRef);
      const attemptData = attemptSnap.data() || {};
      const blockedUntil = attemptData.blockedUntil;
      if (blockedUntil && blockedUntil.toMillis() > now.toMillis()) {
        blocked = true;
        return;
      }
      let count = attemptData.count || 0;
      const lastAttempt = attemptData.lastAttempt;
      if (lastAttempt && now.toMillis() - lastAttempt.toMillis() < 60 * 1000) {
        count += 1;
      } else {
        count = 1;
      }

      const updates = { lastAttempt: now, count };
      if (count > MAX_JOINS_PER_MINUTE) {
        updates.blockedUntil = admin.firestore.Timestamp.fromMillis(
          now.toMillis() + SPAM_BLOCK_DURATION_MS,
        );
        blocked = true;
      } else {
        updates.blockedUntil = admin.firestore.FieldValue.delete();
      }
      tx.set(attemptRef, updates, { merge: true });
    });

    if (blocked) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Too many join attempts, please try again later',
      );
    }

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
