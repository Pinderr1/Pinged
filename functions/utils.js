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

module.exports = { functions, admin, stripe, pushToUser, ensureMatchHistory };
