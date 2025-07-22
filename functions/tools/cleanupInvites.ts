import * as admin from 'firebase-admin';

admin.initializeApp();

async function run() {
  const db = admin.firestore();
  const users = await db.collection('users').get();

  for (const user of users.docs) {
    const invitesSnap = await user.ref.collection('gameInvites').get();
    for (const invite of invitesSnap.docs) {
      const inviteRef = db.collection('gameInvites').doc(invite.id);
      const rootSnap = await inviteRef.get();
      if (rootSnap.exists) {
        const status = invite.get('status');
        if (status && !rootSnap.get('status')) {
          await inviteRef.update({ status });
        }
      }
      await invite.ref.delete();
    }
  }
}

run().then(() => {
  console.log('Cleanup complete');
  process.exit();
});
