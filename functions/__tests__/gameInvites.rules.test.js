import fs from 'fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';

let testEnv;
const matchId = 'alice_bob';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'pinged-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

async function seedUsers({ match = true, blocked = false } = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users/alice'), blocked ? { blockedUsers: ['bob'] } : {});
    await setDoc(doc(db, 'users/bob'), {});
    if (match) {
      await setDoc(doc(db, `matches/${matchId}`), { users: ['alice', 'bob'] });
    }
  });
}

describe('gameInvites security rules', () => {
  test('only sender can create gameInvites', async () => {
    await seedUsers();
    const alice = testEnv.authenticatedContext('alice');
    const bob = testEnv.authenticatedContext('bob');

    const invite = { matchId, from: 'alice', to: 'bob', status: 'pending' };
    await assertSucceeds(
      setDoc(doc(alice.firestore(), 'gameInvites/invite1'), invite)
    );
    await assertFails(
      setDoc(doc(bob.firestore(), 'gameInvites/invite2'), invite)
    );
  });

  test('deny creating gameInvite when users are unmatched', async () => {
    await seedUsers({ match: false });
    const alice = testEnv.authenticatedContext('alice');
    const invite = { matchId, from: 'alice', to: 'bob', status: 'pending' };
    await assertFails(
      setDoc(doc(alice.firestore(), 'gameInvites/invite1'), invite)
    );
  });

  test('deny creating gameInvite when users are blocked', async () => {
    await seedUsers({ blocked: true });
    const alice = testEnv.authenticatedContext('alice');
    const invite = { matchId, from: 'alice', to: 'bob', status: 'pending' };
    await assertFails(
      setDoc(doc(alice.firestore(), 'gameInvites/invite1'), invite)
    );
  });

  test('only participants may read and update invites', async () => {
    await seedUsers();
    const alice = testEnv.authenticatedContext('alice');
    const bob = testEnv.authenticatedContext('bob');
    const carol = testEnv.authenticatedContext('carol');

    const inviteRef = doc(alice.firestore(), 'gameInvites/invite1');
    const data = { matchId, from: 'alice', to: 'bob', status: 'pending' };
    await assertSucceeds(setDoc(inviteRef, data));

    await assertSucceeds(getDoc(doc(alice.firestore(), 'gameInvites/invite1')));
    await assertSucceeds(getDoc(doc(bob.firestore(), 'gameInvites/invite1')));
    await assertFails(getDoc(doc(carol.firestore(), 'gameInvites/invite1')));

    await assertSucceeds(
      updateDoc(doc(alice.firestore(), 'gameInvites/invite1'), { status: 'accepted' })
    );
    await assertSucceeds(
      updateDoc(doc(bob.firestore(), 'gameInvites/invite1'), { status: 'declined' })
    );
    await assertFails(
      updateDoc(doc(carol.firestore(), 'gameInvites/invite1'), { status: 'ignored' })
    );
  });
});

