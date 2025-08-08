const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Helper to fetch timezone based on IP using a free API
async function lookupTimezone(ip) {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) throw new Error('lookup failed');
    const data = await res.json();
    return data.timezone || 'UTC';
  } catch (e) {
    console.warn('Timezone lookup failed', e);
    return 'UTC';
  }
}

// Callable function to infer and store user's timezone
const setTimezone = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  const ip =
    context.rawRequest.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    context.rawRequest.ip;

  const timezone = await lookupTimezone(ip);
  await admin
    .firestore()
    .collection('users')
    .doc(uid)
    .set({ timezone }, { merge: true });
  return { timezone };
});

module.exports = { setTimezone };
