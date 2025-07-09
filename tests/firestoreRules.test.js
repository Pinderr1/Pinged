const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-project',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });

  const getDb = (uid) => testEnv.authenticatedContext(uid).firestore();

  await testEnv.clearFirestore();

  // Helper to seed data without security rules
  const seed = async (cb) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await cb(context.firestore());
    });
  };

  try {
    // users can read/write their own profiles
    await assertSucceeds(getDb('alice').collection('users').doc('alice').set({name: 'Alice'}));
    await assertSucceeds(getDb('alice').collection('users').doc('alice').get());
    await assertFails(getDb('bob').collection('users').doc('alice').get());
    await assertFails(getDb('bob').collection('users').doc('alice').set({name: 'Hacker'}));

    // only matched users can access matches
    await seed(async (db) => {
      await db.collection('matches').doc('match1').set({ users: ['alice', 'bob'] });
    });
    await assertSucceeds(getDb('alice').collection('matches').doc('match1').get());
    await assertSucceeds(getDb('bob').collection('matches').doc('match1').collection('messages').doc('m1').set({ text: 'hi' }));
    await assertFails(getDb('carol').collection('matches').doc('match1').get());
    await assertFails(getDb('carol').collection('matches').doc('match1').collection('messages').doc('m2').set({ text: 'bad' }));

    // event participants only
    await seed(async (db) => {
      await db.collection('events').doc('event1').set({ participants: ['alice'] });
    });
    await assertSucceeds(getDb('alice').collection('events').doc('event1').collection('messages').add({ text: 'hey' }));
    await assertFails(getDb('bob').collection('events').doc('event1').collection('messages').add({ text: 'nope' }));

    // communityPosts public read, host write only
    await seed(async (db) => {
      await db.collection('communityPosts').doc('post1').set({ hostId: 'alice', text: 'hello' });
    });
    await assertSucceeds(getDb('bob').collection('communityPosts').doc('post1').get());
    await assertSucceeds(getDb('alice').collection('communityPosts').doc('post1').set({ hostId: 'alice', text: 'edit' }));
    await assertFails(getDb('bob').collection('communityPosts').doc('post1').set({ hostId: 'alice', text: 'hack' }));

    console.log('Firestore rules tests completed');
  } finally {
    await testEnv.cleanup();
  }
})();
