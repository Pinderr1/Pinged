const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const fetch = require('node-fetch');
require('dotenv').config();

admin.initializeApp();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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
  const { uid, title, message, extra } = data || {};
  if (!uid || !message) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'uid and message are required'
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
