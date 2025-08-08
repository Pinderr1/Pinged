const functions = require('firebase-functions');
const admin = require('firebase-admin');

const DEFAULTS = {
  maxFreeGames: 1,
  maxDailyEvents: 1,
  maxDailyLikes: 100,
};

async function loadConfig() {
  try {
    const snap = await admin.firestore().collection('config').doc('app').get();
    const data = snap.data() || {};
    return {
      gameLimit: Number.isFinite(data.maxFreeGames) ? data.maxFreeGames : DEFAULTS.maxFreeGames,
      eventLimit: Number.isFinite(data.maxDailyEvents)
        ? data.maxDailyEvents
        : DEFAULTS.maxDailyEvents,
      likeLimit: Number.isFinite(data.maxDailyLikes) ? data.maxDailyLikes : DEFAULTS.maxDailyLikes,
    };
  } catch (e) {
    console.warn('Failed to load config limits', e);
    return {
      gameLimit: DEFAULTS.maxFreeGames,
      eventLimit: DEFAULTS.maxDailyEvents,
      likeLimit: DEFAULTS.maxDailyLikes,
    };
  }
}

function dateString(ts, tz) {
  return new Date(ts).toLocaleDateString('en-US', { timeZone: tz });
}

const recordGamePlayed = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const db = admin.firestore();
  const limits = await loadConfig();
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const user = snap.data() || {};
    const isPremium = !!user.isPremium;
    if (isPremium) {
      tx.update(userRef, { lastGamePlayedAt: admin.firestore.FieldValue.serverTimestamp() });
      return;
    }
    const tz = user.timezone || 'UTC';
    const now = Date.now();
    const last = user.lastGamePlayedAt?.toMillis?.() || user.lastGamePlayedAt || 0;
    let count = 0;
    if (last && dateString(now, tz) === dateString(last, tz)) {
      count = user.dailyPlayCount || 0;
    }
    if (count >= limits.gameLimit) {
      throw new functions.https.HttpsError('resource-exhausted', 'Daily game limit reached');
    }
    tx.update(userRef, {
      dailyPlayCount: count + 1,
      lastGamePlayedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  return { success: true };
});

const getLimits = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const db = admin.firestore();
  const [userSnap, cfg] = await Promise.all([
    db.collection('users').doc(uid).get(),
    loadConfig(),
  ]);
  const user = userSnap.data() || {};
  const tz = user.timezone || 'UTC';
  const isPremium = !!user.isPremium;

  function remaining(count, last, limit) {
    if (isPremium) return Infinity;
    const nowStr = dateString(Date.now(), tz);
    const lastMs = last?.toMillis?.() || last;
    const lastStr = lastMs ? dateString(lastMs, tz) : null;
    if (lastStr && nowStr === lastStr) {
      return Math.max(limit - (count || 0), 0);
    }
    return limit;
  }

  const gamesLeft = remaining(user.dailyPlayCount, user.lastGamePlayedAt, cfg.gameLimit);
  const eventsLeft = remaining(user.dailyEventCount, user.lastEventCreatedAt, cfg.eventLimit);
  const likesLeft = remaining(user.dailyLikeCount, user.lastLikeSentAt, cfg.likeLimit);

  return {
    gamesLeft,
    eventsLeft,
    likesLeft,
    gameLimit: isPremium ? Infinity : cfg.gameLimit,
    eventLimit: isPremium ? Infinity : cfg.eventLimit,
    likeLimit: isPremium ? Infinity : cfg.likeLimit,
  };
});

module.exports = { getLimits, recordGamePlayed };
