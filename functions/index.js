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
      success_url: data.successUrl || process.env.SUCCESS_URL,
      cancel_url: data.cancelUrl || process.env.CANCEL_URL
    });
    return { url: session.url };
  } catch (err) {
    console.error('Failed to create checkout session', err);
    throw new functions.https.HttpsError('internal', 'Unable to create session');
  }
});

exports.stripeWebhook = functions.https.onRequest((req, res) => {
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
      admin.firestore().collection('users').doc(uid).update({
        isPremium: true,
        premiumUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(e => console.error('Failed to update premium status', e));
    }
  }

  res.status(200).send('ok');
});

exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
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
    try {
      await userRef.update({
        online: status.state === 'online',
        lastSeenAt: admin.firestore.Timestamp.fromMillis(status.last_changed),
      });
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
      await matchRef.set(
        { messageCounts: { [senderId]: admin.firestore.FieldValue.increment(1) } },
        { merge: true }
      );

      const matchSnap = await admin
        .firestore()
        .collection('matches')
        .doc(matchId)
        .get();
      const matchData = matchSnap.data();
      const users = (matchData && matchData.users) || [];
      const recipientId = users.find((u) => u !== senderId);
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
