const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const fetch = require('node-fetch');
require('dotenv').config();

admin.initializeApp();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function pushToUser(uid, title, body, extra = {}) {
  const snap = await admin.firestore().collection('users').doc(uid).get();
  const userData = snap.data();
  const token = userData && userData.expoPushToken;
  if (!token) {
    console.log(`No Expo push token for user ${uid}`);
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

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  const uid = context.auth && context.auth.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        { price: process.env.STRIPE_PRICE_ID, quantity: 1 }
      ],
      metadata: { uid },
      success_url: data.successUrl || process.env.EXPO_PUBLIC_SUCCESS_URL,
      cancel_url: data.cancelUrl || process.env.EXPO_PUBLIC_CANCEL_URL
    });
    return { url: session.url };
  } catch (err) {
    console.error('Failed to create checkout session', err);
    throw new functions.https.HttpsError('internal', 'Unable to create session');
  }
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const uid = session.metadata && session.metadata.uid;
    if (uid) {
      try {
        await admin.firestore().collection('users').doc(uid).update({
          isPremium: true,
          premiumUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {
        console.error('Failed to update premium status', e);
        return res.status(500).send('Failed to update user');
      }
    }
  }

  res.status(200).send('ok');
});

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

  // Ensure the caller is targeting themselves or has elevated privileges
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

async function ensureMatchHistory(users, extra = {}) {
  if (!Array.isArray(users) || users.length < 2) return null;
  const sorted = [...users].sort();
  const id = sorted.join('_');
  const ref = admin.firestore().collection('matchHistory').doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    let likeInitiator = null;
    try {
      const [a, b] = await Promise.all([
        admin
          .firestore()
          .collection('likes')
          .doc(sorted[0])
          .collection('liked')
          .doc(sorted[1])
          .get(),
        admin
          .firestore()
          .collection('likes')
          .doc(sorted[1])
          .collection('liked')
          .doc(sorted[0])
          .get(),
      ]);
      const t1 = a.get('createdAt');
      const t2 = b.get('createdAt');
      if (t1 && (!t2 || t1.toMillis() <= t2.toMillis())) {
        likeInitiator = sorted[0];
      } else if (t2) {
        likeInitiator = sorted[1];
      }
    } catch (e) {
      console.error('Failed to determine like initiator', e);
    }

    await ref.set(
      {
        users: sorted,
        likeInitiator: likeInitiator || null,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        chatCounts: {},
        ...extra,
      },
      { merge: true }
    );
  } else if (Object.keys(extra).length) {
    await ref.set(extra, { merge: true });
  }
  return ref;
}

exports.onGameInviteCreated = functions.firestore
  .document('gameInvites/{inviteId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.to) return null;
    try {
      await pushToUser(
        data.to,
        'Game Invite',
        `${data.fromName || 'Someone'} invited you to play`,
        { type: 'invite', inviteId: snap.id, gameId: data.gameId }
      );
    } catch (e) {
      console.error('Failed to send invite notification', e);
    }
  return null;
});

exports.resetFreeGameUsage = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const snap = await admin
      .firestore()
      .collection('users')
      .where('freeGameUsed', '==', true)
      .get();

    const tasks = [];
    snap.forEach((doc) => {
      tasks.push(doc.ref.update({ freeGameUsed: false }));
    });

    await Promise.all(tasks);
    console.log(`Reset freeGameUsed for ${tasks.length} users`);
    return null;
  });

exports.onMatchCreated = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !Array.isArray(data.users)) return null;
    await ensureMatchHistory(data.users);
    await Promise.all(
      data.users.map((uid) =>
        pushToUser(uid, 'New Match', 'You have a new match!', {
          type: 'match',
          matchId: snap.id,
        }).catch((e) => console.error('Failed to send match notification', e))
      )
    );
    return null;
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

    // Track when the presence was last updated so we can suggest active users
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

exports.autoStartGame = functions.firestore
  .document('gameInvites/{inviteId}')
  .onUpdate(async (change, context) => {
    const beforeStatus = change.before.get('status');
    const after = change.after.data();
    if (beforeStatus === 'ready' || after.status !== 'ready') return null;

    const inviteId = context.params.inviteId;
    const updates = {
      status: 'active',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const tasks = [change.after.ref.update(updates)];

    if (after.from) {
      tasks.push(
        admin
          .firestore()
          .collection('users')
          .doc(after.from)
          .collection('gameInvites')
          .doc(inviteId)
          .update(updates)
          .catch((e) => console.error('Failed to update sender invite', e))
      );
      tasks.push(
        pushToUser(after.from, 'Game Starting', 'Your game is starting!', {
          type: 'game',
          inviteId,
        }).catch((e) => console.error('Failed to push to sender', e))
      );
    }

    if (after.to) {
      tasks.push(
        admin
          .firestore()
          .collection('users')
          .doc(after.to)
          .collection('gameInvites')
          .doc(inviteId)
          .update(updates)
          .catch((e) => console.error('Failed to update recipient invite', e))
      );
      tasks.push(
        pushToUser(after.to, 'Game Starting', 'Your game is starting!', {
          type: 'game',
          inviteId,
        }).catch((e) => console.error('Failed to push to recipient', e))
      );
    }

    await Promise.all(tasks);
    return null;
  });

exports.trackGameInvite = functions.firestore
  .document('gameInvites/{inviteId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    if (!after.from || !after.to) return null;

    if (before.status !== 'active' && after.status === 'active') {
      await ensureMatchHistory([after.from, after.to], { gameId: after.gameId });
    }

    if (before.status !== 'finished' && after.status === 'finished') {
      const id = [after.from, after.to].sort().join('_');
      await admin
        .firestore()
        .collection('matchHistory')
        .doc(id)
        .set({ endedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }

    return null;
  });

exports.autoStartLobby = functions.firestore
  .document('gameLobbies/{lobbyId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};

    if (after.status === 'active') return null;

    const players = after.players;
    if (!Array.isArray(players) || players.length < 2) return null;

    const beforeReady = before.ready || {};
    const afterReady = after.ready || {};

    const allReady = players.every((uid) => afterReady[uid]);
    const previouslyReady = players.every((uid) => beforeReady[uid]);

    if (!allReady || previouslyReady) return null;

    const lobbyId = context.params.lobbyId;
    const updates = {
      status: 'active',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const tasks = [change.after.ref.update(updates)];

    tasks.push(
      ...players.map((uid) =>
        pushToUser(uid, 'Game Starting', 'Your game is starting!', {
          type: 'game',
          lobbyId,
        }).catch((e) => console.error('Failed to push to user', e))
      )
    );

    await Promise.all(tasks);
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
    console.log(`Sent ${tasks.length} invite reminders`);
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
    console.log(`Sent ${tasks.length} idle player reminders`);
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
    console.log(`Sent ${tasks.length} streak reward notifications`);
    return null;
  });
