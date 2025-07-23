const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');

(async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-project',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });

  const getDb = (uid, token = {}) =>
    testEnv.authenticatedContext(uid, token).firestore();

  await testEnv.clearFirestore();

  // Helper to seed data without security rules
  const seed = async (cb) => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await cb(context.firestore());
    });
  };

  try {
    // users can read/write their own profiles but cannot modify premium fields
    await assertSucceeds(getDb('alice').collection('users').doc('alice').set({ name: 'Alice' }));
    await assertSucceeds(getDb('alice').collection('users').doc('alice').get());
    await assertSucceeds(getDb('bob').collection('users').doc('alice').get());
    await assertFails(getDb('bob').collection('users').doc('alice').set({ name: 'Hacker' }));
    await assertFails(getDb('bob').collection('users').doc('alice').set({ isPremium: true }));
    await assertFails(getDb('bob').collection('users').doc('alice').set({ badges: ['premiumMember'] }));
    await assertFails(getDb('alice').collection('users').doc('alice').set({ isPremium: true }, { merge: true }));
    await assertFails(getDb('alice').collection('users').doc('alice').update({ xp: 10 }));
    await assertFails(getDb('alice').collection('users').doc('alice').update({ streak: 5 }));

    // matches can only be created by the server user
    await seed(async (db) => {
      await db.collection('matches').doc('match1').set({ users: ['alice', 'bob'] });
    });
    await assertSucceeds(getDb('alice').collection('matches').doc('match1').get());
    await assertSucceeds(getDb('bob').collection('matches').doc('match1').update({ typingIndicator: { bob: true } }));
    await assertFails(getDb('bob').collection('matches').add({ users: ['bob', 'carol'] }));
    await assertSucceeds(getDb('server').collection('matches').add({ users: ['bob', 'carol'] }));
    await assertSucceeds(getDb('alice').collection('matches').doc('match1').collection('messages').doc('m1').set({ text: 'hi' }));
    await assertFails(getDb('bob').collection('matches').doc('match1').collection('messages').doc('m1').update({ text: 'edit' }));

    // likes can only be written by the owner
    await assertSucceeds(
      getDb('alice').collection('likes').doc('alice').collection('liked').doc('bob').set({})
    );
    await assertFails(
      getDb('bob').collection('likes').doc('alice').collection('liked').doc('carol').set({})
    );

    // game invites restricted to sender and existing match
    await seed(async (db) => {
      await db.collection('users').doc('alice').set({ matches: { bob: 'match1' } });
    });
    await assertSucceeds(
      getDb('alice').collection('gameInvites').doc('invite1').set({ from: 'alice', to: 'bob' })
    );
    await assertSucceeds(getDb('bob').collection('gameInvites').doc('invite1').get());
    await assertFails(getDb('carol').collection('gameInvites').doc('invite1').get());
    await assertFails(
      getDb('bob').collection('gameInvites').doc('invite1').set({ from: 'alice', to: 'bob' })
    );
    await assertFails(
      getDb('alice').collection('gameInvites').doc('invite2').set({ from: 'alice', to: 'carol' })
    );

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

      // blocks private per user
      await assertSucceeds(
        getDb('alice').collection('blocks').doc('alice').collection('blocked').doc('bob').set({ blockedAt: 1 })
      );
      await assertFails(
        getDb('bob').collection('blocks').doc('alice').collection('blocked').doc('carol').set({})
      );
      await assertSucceeds(
        getDb('alice').collection('blocks').doc('alice').collection('blocked').get()
      );
    await assertFails(
      getDb('bob').collection('blocks').doc('alice').collection('blocked').get()
    );

    // admin can read flagged profiles
    await seed(async (db) => {
      await db.collection('users').doc('flagged').set({ flaggedForReview: true });
    });
    await assertSucceeds(
      getDb('admin', { admin: true }).collection('users').doc('flagged').get()
    );

    // likedBy subcollection read restrictions
    await seed(async (db) => {
      await db.collection('likes').doc('alice').collection('likedBy').doc('bob').set({});
    });
    await assertSucceeds(
      getDb('alice').collection('likes').doc('alice').collection('likedBy').get()
    );
    await assertFails(
      getDb('carol').collection('likes').doc('alice').collection('likedBy').get()
    );

  } finally {
    await testEnv.cleanup();
  }
})();
