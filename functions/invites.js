const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { pushToUser } = require('./notifications');

// Helper to ensure match history exists
async function ensureMatchHistory(users, extra = {}) {
  if (!Array.isArray(users) || users.length < 2) return null;
  const sorted = [...users].sort();
  const id = sorted.join('_');
  const ref = admin.firestore().collection('matchHistory').doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    let likeInitiator = null;
    try {
      const [a, b] = await Promise.all([
        admin.firestore().collection('likes').doc(sorted[0]).collection('liked').doc(sorted[1]).get(),
        admin.firestore().collection('likes').doc(sorted[1]).collection('liked').doc(sorted[0]).get(),
      ]);
      const t1 = a.get('createdAt');
      const t2 = b.get('createdAt');
      if (t1 && (!t2 || t1.toMillis() <= t2.toMillis())) {
        likeInitiator = sorted[0];
      } else if (t2) {
        likeInitiator = sorted[1];
      }
    } catch (e) {
      console.error('Failed to determine like initiator', e);
    }

    await ref.set(
      {
        users: sorted,
        likeInitiator: likeInitiator || null,
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        chatCounts: {},
        ...extra,
      },
      { merge: true },
    );
  } else if (Object.keys(extra).length) {
    await ref.set(extra, { merge: true });
  }
  return ref;
}

const onGameInviteCreated = functions.firestore
  .document('gameInvites/{inviteId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !data.to) return null;
    try {
      await pushToUser(
        data.to,
        'Game Invite',
        `${data.fromName || 'Someone'} invited you to play`,
        { type: 'invite', inviteId: snap.id, gameId: data.gameId },
      );
    } catch (e) {
      console.error('Failed to send invite notification', e);
    }
    return null;
  });

const onNewInvite = onGameInviteCreated;

const resetFreeGameUsage = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const snap = await admin
      .firestore()
      .collection('users')
      .where('freeGamesToday', '>', 0)
      .get();

    const tasks = [];
    snap.forEach((doc) => {
      tasks.push(doc.ref.update({ freeGamesToday: 0, freeGameUsed: false }));
    });

    await Promise.all(tasks);
    functions.logger.info(`Reset freeGamesToday for ${tasks.length} users`);
    return null;
  });

const onMatchCreated = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if (!data || !Array.isArray(data.users)) return null;
    await ensureMatchHistory(data.users);
    await Promise.all(
      data.users.map((uid) =>
        pushToUser(uid, 'New Match', 'You have a new match!', {
          type: 'match',
          matchId: snap.id,
        }).catch((e) => console.error('Failed to send match notification', e)),
      ),
    );
    return null;
  });

const syncPresence = functions.database
  .ref('/status/{uid}')
  .onWrite(async (change, context) => {
    const status = change.after.val();
    const uid = context.params.uid;
    const userRef = admin.firestore().collection('users').doc(uid);

    const updates = {};

    if (status) {
      updates.online = status.state === 'online';

      if (status.last_changed) {
        updates.lastOnline = admin.firestore.Timestamp.fromMillis(status.last_changed);
      } else {
        updates.lastOnline = admin.firestore.FieldValue.serverTimestamp();
      }
    } else {
      updates.online = false;
      const before = change.before.val();
      if (before && before.last_changed) {
        updates.lastOnline = admin.firestore.Timestamp.fromMillis(before.last_changed);
      } else {
        updates.lastOnline = admin.firestore.FieldValue.serverTimestamp();
      }
    }

    try {
      await userRef.set(updates, { merge: true });
    } catch (e) {
      console.error('Failed to sync presence', e);
    }
    return null;
  });

const autoStartGame = functions.firestore
  .document('gameInvites/{inviteId}')
  .onUpdate(async (change, context) => {
    const beforeStatus = change.before.get('status');
    const after = change.after.data();
    if (beforeStatus === 'ready' || after.status !== 'ready') return null;

    const inviteId = context.params.inviteId;
    const updates = {
      status: 'active',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const tasks = [change.after.ref.update(updates)];

    if (after.from) {
      tasks.push(
        admin
          .firestore()
          .collection('users')
          .doc(after.from)
          .collection('gameInvites')
          .doc(inviteId)
          .update(updates)
          .catch((e) => console.error('Failed to update sender invite', e)),
      );
      tasks.push(
        pushToUser(after.from, 'Game Starting', 'Your game is starting!', {
          type: 'game',
          inviteId,
        }).catch((e) => console.error('Failed to push to sender', e)),
      );
    }

    if (after.to) {
      tasks.push(
        admin
          .firestore()
          .collection('users')
          .doc(after.to)
          .collection('gameInvites')
          .doc(inviteId)
          .update(updates)
          .catch((e) => console.error('Failed to update recipient invite', e)),
      );
      tasks.push(
        pushToUser(after.to, 'Game Starting', 'Your game is starting!', {
          type: 'game',
          inviteId,
        }).catch((e) => console.error('Failed to push to recipient', e)),
      );
    }

    await Promise.all(tasks);
    return null;
  });

const trackGameInvite = functions.firestore
  .document('gameInvites/{inviteId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    if (!after.from || !after.to) return null;

    if (before.status !== 'active' && after.status === 'active') {
      await ensureMatchHistory([after.from, after.to], { gameId: after.gameId });
    }

    if (before.status !== 'finished' && after.status === 'finished') {
      const id = [after.from, after.to].sort().join('_');
      await admin
        .firestore()
        .collection('matchHistory')
        .doc(id)
        .set({ endedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }

    return null;
  });

const autoStartLobby = functions.firestore
  .document('gameLobbies/{lobbyId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};

    if (after.status === 'active') return null;

    const players = after.players;
    if (!Array.isArray(players) || players.length < 2) return null;

    const beforeReady = before.ready || {};
    const afterReady = after.ready || {};

    const allReady = players.every((uid) => afterReady[uid]);
    const previouslyReady = players.every((uid) => beforeReady[uid]);

    if (!allReady || previouslyReady) return null;

    const lobbyId = context.params.lobbyId;
    const updates = {
      status: 'active',
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const tasks = [change.after.ref.update(updates)];

    tasks.push(
      ...players.map((uid) =>
        pushToUser(uid, 'Game Starting', 'Your game is starting!', {
          type: 'game',
          lobbyId,
        }).catch((e) => console.error('Failed to push to user', e)),
      ),
    );

    await Promise.all(tasks);
    return null;
  });

const onChatMessageCreated = functions.firestore
  .document('matches/{matchId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const senderId = data.senderId;
    const matchId = context.params.matchId;
    if (!senderId) return null;

    try {
      const matchRef = admin.firestore().collection('matches').doc(matchId);
      const matchSnap = await matchRef.get();
      const matchData = matchSnap.data() || {};

      const lastSender = matchData.lastSenderId;
      const lastTime = matchData.lastMessageAt?.toDate?.();
      const ts = data.timestamp?.toDate?.() || snap.createTime.toDate();

      const updates = {
        messageCounts: { [senderId]: admin.firestore.FieldValue.increment(1) },
        lastSenderId: senderId,
        lastMessageAt: data.timestamp || admin.firestore.FieldValue.serverTimestamp(),
      };

      if (lastSender && lastSender !== senderId && lastTime) {
        const diff = ts.getTime() - lastTime.getTime();
        updates.chatCounts = { [senderId]: admin.firestore.FieldValue.increment(1) };
        updates.replyTotals = { [senderId]: admin.firestore.FieldValue.increment(diff) };
        updates.replyCounts = { [senderId]: admin.firestore.FieldValue.increment(1) };
      }

      await matchRef.set(updates, { merge: true });
      await admin.firestore().collection('matchHistory').doc(matchId).set(updates, { merge: true });

      const users = matchData.users || [];
      const recipientId = users.find((u) => u !== senderId);
      await ensureMatchHistory(users);
      const histId = [...users].sort().join('_');
      await admin
        .firestore()
        .collection('matchHistory')
        .doc(histId)
        .set(
          {
            chatCounts: {
              [senderId]: admin.firestore.FieldValue.increment(1),
            },
          },
          { merge: true },
        );
      if (!recipientId) return null;

      await pushToUser(recipientId, 'New Message', data.text || 'You have a new message', {
        type: 'chat',
        matchId,
      });
    } catch (e) {
      console.error('Failed to send chat notification', e);
    }

    return null;
  });

module.exports = {
  onGameInviteCreated,
  onNewInvite,
  resetFreeGameUsage,
  onMatchCreated,
  syncPresence,
  autoStartGame,
  trackGameInvite,
  autoStartLobby,
  onChatMessageCreated,
};
