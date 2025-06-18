const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
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
