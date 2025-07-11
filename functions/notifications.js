const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = global.fetch;
// Load environment variables from root .env file without external packages
require('../loadEnv.js');

async function pushToUser(uid, title, body, extra = {}) {
  const snap = await admin.firestore().collection('users').doc(uid).get();
  const userData = snap.data();
  const token = userData && userData.pushToken;
  if (!token) {
    functions.logger.info(`No Expo push token for user ${uid}`);
    return null;
  }

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title: title || 'Pinged',
      sound: 'default',
      body,
      data: extra,
    }),
  });

  return res.json();
}

const sendPushNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated',
    );
  }

  const { uid, title, message, extra } = data || {};
  if (!uid || !message) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'uid and message are required',
    );
  }

  if (context.auth.uid !== uid && !context.auth.token?.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Not authorized to send push notification to this user',
    );
  }

  try {
    const snap = await admin.firestore().collection('users').doc(uid).get();
    const userData = snap.data();
    const token = userData && userData.pushToken;
    if (!token) {
      throw new Error('No Expo push token for user');
    }

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title: title || 'Pinged',
        sound: 'default',
        body: message,
        data: extra || {},
      }),
    });

    const result = await res.json();
    return result;
  } catch (e) {
    console.error('Failed to send push notification', e);
    throw new functions.https.HttpsError(
      'internal',
      'Unable to send push notification',
    );
  }
});

const remindPendingInvites = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async () => {
    const threshold = new Date(Date.now() - 60 * 60 * 1000);
    const snap = await admin
      .firestore()
      .collection('gameInvites')
      .where('status', '==', 'pending')
      .where('createdAt', '<=', threshold)
      .get();

    const tasks = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (!data || !data.to) return;
      tasks.push(
        pushToUser(
          data.to,
          'Reminder',
          `${data.fromName || 'Someone'} invited you to play`,
          { type: 'invite', inviteId: doc.id, gameId: data.gameId },
        ).catch((e) => console.error('Failed to push invite reminder', e)),
      );
    });

    await Promise.all(tasks);
    functions.logger.info(`Sent ${tasks.length} invite reminders`);
    return null;
  });

const remindIdlePlayers = functions.pubsub
  .schedule('0 12 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const snap = await admin
      .firestore()
      .collection('users')
      .where('lastPlayedAt', '<', threshold)
      .get();

    const tasks = [];
    snap.forEach((doc) => {
      tasks.push(
        pushToUser(
          doc.id,
          'Time to play!',
          "It's been a while since you played. Jump back in!",
          { type: 'reengage' },
        ).catch((e) => console.error('Failed to send idle reminder', e)),
      );
    });

    await Promise.all(tasks);
    functions.logger.info(`Sent ${tasks.length} idle player reminders`);
    return null;
  });

const notifyStreakRewards = functions.pubsub
  .schedule('15 0 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const snap = await admin
      .firestore()
      .collection('users')
      .where('streak', '>=', 7)
      .where('lastPlayedAt', '>=', threshold)
      .get();

    const tasks = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (!data) return;
      const lastPlayed = data.lastPlayedAt?.toDate?.() || data.lastPlayedAt;
      const rewardedAt = data.streakRewardedAt?.toDate?.() || data.streakRewardedAt;
      if (!lastPlayed) return;
      if (data.streak % 7 === 0 && (!rewardedAt || rewardedAt < lastPlayed)) {
        tasks.push(
          pushToUser(
            doc.id,
            'Streak Reward!',
            `You reached a ${data.streak}-day streak!`,
            { type: 'streak', streak: data.streak },
          )
            .then(() =>
              doc.ref.update({
                streakRewardedAt: admin.firestore.FieldValue.serverTimestamp(),
              }),
            )
            .catch((e) => console.error('Failed to send streak reward', e)),
        );
      }
    });

    await Promise.all(tasks);
    functions.logger.info(`Sent ${tasks.length} streak reward notifications`);
    return null;
  });

module.exports = {
  sendPushNotification,
  remindPendingInvites,
  remindIdlePlayers,
  notifyStreakRewards,
  pushToUser, // for use in other modules but not exported by index
};
