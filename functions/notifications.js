const { functions, admin, pushToUser, ensureMatchHistory } = require('./utils');

exports.sendPushNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { uid, title, message, extra } = data || {};
  if (!uid || !message) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'uid and message are required'
    );
  }

  if (context.auth.uid !== uid && !context.auth.token?.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Not authorized to send push notification to this user'
    );
  }

  try {
    const snap = await admin.firestore().collection('users').doc(uid).get();
    const userData = snap.data();
    const token = userData && userData.expoPushToken;
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
      'Unable to send push notification'
    );
  }
});

exports.syncPresence = functions.database
  .ref('/status/{uid}')
  .onWrite(async (change, context) => {
    const status = change.after.val();
    if (!status) return null;
    const uid = context.params.uid;
    const userRef = admin.firestore().collection('users').doc(uid);
    const updates = {
      online: status.state === 'online',
    };

    if (status.last_changed) {
      updates.lastOnline = admin.firestore.Timestamp.fromMillis(status.last_changed);
    } else {
      updates.lastOnline = admin.firestore.FieldValue.serverTimestamp();
    }

    try {
      await userRef.set(updates, { merge: true });
    } catch (e) {
      console.error('Failed to sync presence', e);
    }
    return null;
  });

exports.onChatMessageCreated = functions.firestore
  .document('matches/{matchId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const senderId = data.senderId;
    const matchId = context.params.matchId;
    if (!senderId) return null;

    try {
      const matchRef = admin.firestore().collection('matches').doc(matchId);
      const matchSnap = await matchRef.get();
      const matchData = matchSnap.data() || {};

      const lastSender = matchData.lastSenderId;
      const lastTime = matchData.lastMessageAt?.toDate?.();
      const ts = data.timestamp?.toDate?.() || snap.createTime.toDate();

      const updates = {
        messageCounts: { [senderId]: admin.firestore.FieldValue.increment(1) },
        lastSenderId: senderId,
        lastMessageAt: data.timestamp || admin.firestore.FieldValue.serverTimestamp(),
      };

      if (lastSender && lastSender !== senderId && lastTime) {
        const diff = ts.getTime() - lastTime.getTime();
        updates.chatCounts = { [senderId]: admin.firestore.FieldValue.increment(1) };
        updates.replyTotals = { [senderId]: admin.firestore.FieldValue.increment(diff) };
        updates.replyCounts = { [senderId]: admin.firestore.FieldValue.increment(1) };
      }

      await matchRef.set(updates, { merge: true });
      await admin.firestore().collection('matchHistory').doc(matchId).set(updates, { merge: true });

      const users = matchData.users || [];
      const recipientId = users.find((u) => u !== senderId);
      await ensureMatchHistory(users);
      const histId = [...users].sort().join('_');
      await admin
        .firestore()
        .collection('matchHistory')
        .doc(histId)
        .set(
          {
            chatCounts: {
              [senderId]: admin.firestore.FieldValue.increment(1),
            },
          },
          { merge: true }
        );
      if (!recipientId) return null;

      await pushToUser(recipientId, 'New Message', data.text || 'You have a new message', {
        type: 'chat',
        matchId,
      });
    } catch (e) {
      console.error('Failed to send chat notification', e);
    }

    return null;
  });

exports.remindPendingInvites = functions.pubsub
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
          { type: 'invite', inviteId: doc.id, gameId: data.gameId }
        ).catch((e) => console.error('Failed to push invite reminder', e))
      );
    });

    await Promise.all(tasks);
    functions.logger.info(`Sent ${tasks.length} invite reminders`);
    return null;
  });

exports.remindIdlePlayers = functions.pubsub
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
          { type: 'reengage' }
        ).catch((e) => console.error('Failed to send idle reminder', e))
      );
    });

    await Promise.all(tasks);
    functions.logger.info(`Sent ${tasks.length} idle player reminders`);
    return null;
  });

exports.notifyStreakRewards = functions.pubsub
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
            { type: 'streak', streak: data.streak }
          )
            .then(() =>
              doc.ref.update({
                streakRewardedAt: admin.firestore.FieldValue.serverTimestamp(),
              })
            )
            .catch((e) => console.error('Failed to send streak reward', e))
        );
      }
    });

    await Promise.all(tasks);
    functions.logger.info(`Sent ${tasks.length} streak reward notifications`);
    return null;
  });
