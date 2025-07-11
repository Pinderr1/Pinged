const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
// Load environment variables from root .env file without external packages
require('../loadEnv.js');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = functions.https.onCall(async (data, context) => {
  const uid = context.auth && context.auth.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        { price: process.env.STRIPE_PRICE_ID, quantity: 1 },
      ],
      metadata: { uid },
      success_url: data.successUrl || process.env.EXPO_PUBLIC_SUCCESS_URL,
      cancel_url: data.cancelUrl || process.env.EXPO_PUBLIC_CANCEL_URL,
    });
    return { url: session.url };
  } catch (err) {
    console.error('Failed to create checkout session', err);
    throw new functions.https.HttpsError('internal', 'Unable to create session');
  }
});

const stripeWebhook = functions.https.onRequest(async (req, res) => {
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
          badges: admin.firestore.FieldValue.arrayUnion('premiumMember'),
        });
      } catch (e) {
        console.error('Failed to update premium status', e);
        return res.status(500).send('Failed to update user');
      }
    }
  }

  res.status(200).send('ok');
});

module.exports = {
  createCheckoutSession,
  stripeWebhook,
};
