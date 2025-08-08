const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
// Load environment variables from root .env file without external packages
require('../loadEnv.js');

const REQUIRED_KEYS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_ID',
  'STRIPE_WEBHOOK_SECRET',
  'EXPO_PUBLIC_SUCCESS_URL',
  'EXPO_PUBLIC_CANCEL_URL',
];

const missingKeys = REQUIRED_KEYS.filter((key) => !process.env[key]);
if (missingKeys.length) {
  throw new Error(`Missing environment variables: ${missingKeys.join(', ')}`);
}

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
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const uid = session.metadata && session.metadata.uid;
        if (uid) {
          await admin.firestore().collection('users').doc(uid).update({
            isPremium: true,
            premiumUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            badges: admin.firestore.FieldValue.arrayUnion('premiumMember'),
          });
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const uid = subscription.metadata && subscription.metadata.uid;
          if (uid) {
            await admin.firestore().collection('users').doc(uid).update({
              isPremium: true,
              premiumUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
              premiumExpiresAt: admin.firestore.Timestamp.fromMillis(
                subscription.current_period_end * 1000,
              ),
              badges: admin.firestore.FieldValue.arrayUnion('premiumMember'),
            });
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const uid = subscription.metadata && subscription.metadata.uid;
        if (uid) {
          await admin.firestore().collection('users').doc(uid).update({
            isPremium: false,
            premiumUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            premiumExpiresAt: admin.firestore.FieldValue.delete(),
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error('Failed to handle Stripe webhook', e);
    return res.status(500).send('Webhook handler failed');
  }

  res.status(200).send('ok');
});

const refreshPremiumStatus = functions.https.onCall(async (data, context) => {
  const uid = context.auth && context.auth.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  try {
    const ref = admin.firestore().collection('users').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return { isPremium: false };
    const data = snap.data();
    const expiresAt = data.premiumExpiresAt?.toDate?.() || null;
    const now = new Date();
    if (expiresAt && expiresAt > now) {
      if (!data.isPremium) await ref.update({ isPremium: true });
      return { isPremium: true };
    }
    if (data.isPremium) await ref.update({ isPremium: false });
    return { isPremium: false };
  } catch (e) {
    console.error('Failed to refresh premium status', e);
    throw new functions.https.HttpsError('internal', 'Failed to refresh status');
  }
});

module.exports = {
  createCheckoutSession,
  stripeWebhook,
  refreshPremiumStatus,
};
