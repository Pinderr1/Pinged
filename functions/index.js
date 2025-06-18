const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.paymentWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  const event = req.body;
  if (event.type === 'payment_success') {
    const uid = event.data.userId;
    if (uid) {
      try {
        await admin.firestore().collection('users').doc(uid).update({
          isPremium: true,
          premiumUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {
        console.error('Failed to update premium status', e);
        res.status(500).send('error');
        return;
      }
    }
  }
  res.status(200).send('ok');
});
