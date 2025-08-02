const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { pushToUser } = require('./notifications');
const { createMatchIfMutualLikeInternal } = require('./src/match.js');

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

// Remove match history document for a pair of users
async function deleteMatchHistory(users) {
  if (!Array.isArray(users) || users.length < 2) return null;
  const id = [...users].sort().join('_');
  try {
    await admin.firestore().collection('matchHistory').doc(id).delete();
  } catch (e) {
    console.error('Failed to delete match history', e);
  }
  return null;
}

const onGameInviteCreated = functions.firestore
  .document('gameInvites/{inviteId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const { from, to, gameId, fromName } = data;
    if (!from || !to) return null;

    const matchId = [from, to].sort().join('_');
    const matchSnap = await admin.firestore().collection('matches').doc(matchId).get();
    if (!matchSnap.exists) {
      await snap.ref.delete();
      return null;
    }

    try {
      await pushToUser(
        to,
        'Game Invite',
        `${fromName || 'Someone'} invited you to play`,
        { type: 'invite', inviteId: snap.id, gameId },
      );
    } catch (e) {
      console.error('Failed to send invite notification', e);
    }
    return null;
  });

const onNewInvite = onGameInviteCreated;


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
    if (!status) return null;
    const uid = context.params.uid;
    const userRef = admin.firestore().collection('users').doc(uid);
    const updates = {
      online: status.state === 'online',
    };

    if (status.last_changed) {
      updates.lastOnline = admin.firestore.Timestamp.fromMillis(status.last_changed);
    } else {
      updates.lastOnline = admin.firestore.FieldValue.serverTimestamp();
    }

    try {
      await userRef.set(updates, { merge: true });
    } catch (e) {
      console.error('Failed to sync presence', e);
    }
    return null;
  });

const onUserProfileUpdate = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const uid = context.params.uid;
    const updates = {};
    const fields = ['photoURL', 'avatarOverlay', 'xp', 'streak', 'badges', 'isPremium'];
    const defaults = {
      photoURL: '',
      avatarOverlay: '',
      xp: 0,
      streak: 0,
      badges: [],
      isPremium: false,
    };

    fields.forEach((field) => {
      if (before[field] !== after[field]) {
        updates[field] = after[field] ?? defaults[field];
      }
    });

    if (!Object.keys(updates).length) return null;

    const statusRef = admin.database().ref(`/status/${uid}`);

    try {
      await statusRef.update(updates);
    } catch (e) {
      console.error('Failed to propagate profile update', e);
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
        pushToUser(after.from, 'Game Starting', 'Your game is starting!', {
          type: 'game',
          inviteId,
        }).catch((e) => console.error('Failed to push to sender', e)),
      );
    }

    if (after.to) {
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

const cleanupFinishedSession = functions.firestore
  .document('gameSessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const beforeOver = before.gameover;
    const afterOver = after.gameover;

    if (!beforeOver && afterOver) {
      const sessionId = context.params.sessionId;
      const inviteRef = admin.firestore().collection('gameInvites').doc(sessionId);
      await Promise.all([
        inviteRef
          .update({
            status: 'finished',
            endedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
          .catch((e) => console.error('Failed to update invite on cleanup', e)),
        change.after.ref.set(
          {
            archived: true,
            archivedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
      ]);
    }

    return null;
  });

const onInviteDeleted = functions.firestore
  .document('gameInvites/{inviteId}')
  .onDelete(async (snap, context) => {
    const data = snap.data() || {};
    const { from, to } = data;
    if (from && to) {
      await deleteMatchHistory([from, to]);
    }
    return null;
  });

const onMatchDeleted = functions.firestore
  .document('matches/{matchId}')
  .onDelete(async (snap, context) => {
    const matchId = context.params.matchId;
    try {
      await admin.firestore().collection('matchHistory').doc(matchId).delete();
    } catch (e) {
      console.error('Failed to delete match history on match delete', e);
    }
    return null;
  });

const acceptInvite = functions.https.onCall(async (data, context) => {
  const inviteId = data?.inviteId;
  const uid = context.auth?.uid;

  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  if (!inviteId) {
    throw new functions.https.HttpsError('invalid-argument', 'inviteId is required');
  }

  const db = admin.firestore();
  const inviteRef = db.collection('gameInvites').doc(inviteId);
  let matchId = null;
  let fromUid = null;
  let toUid = null;
  let gameId = null;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(inviteRef);
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'Invite not found');
    }

    const invite = snap.data() || {};
    fromUid = invite.from;
    toUid = invite.to;
    gameId = invite.gameId;

    if (toUid !== uid && fromUid !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not an invite participant');
    }

    const alreadyAccepted = Array.isArray(invite.acceptedBy) && invite.acceptedBy.includes(uid);
    if (alreadyAccepted) {
      matchId = [fromUid, toUid].sort().join('_');
      return;
    }

    const acceptedBy = Array.isArray(invite.acceptedBy) ? [...invite.acceptedBy, uid] : [uid];
    const updates = { acceptedBy };

    const bothAccepted = acceptedBy.includes(fromUid) && acceptedBy.includes(toUid);
    if (bothAccepted) {
      matchId = [fromUid, toUid].sort().join('_');
      updates.status = 'ready';
      updates.gameSessionId = inviteId;

      const sessionRef = db.collection('gameSessions').doc(inviteId);
      const sessionSnap = await tx.get(sessionRef);
      if (!sessionSnap.exists) {
        tx.set(sessionRef, {
          gameId,
          players: [fromUid, toUid],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      const res = await createMatchIfMutualLikeInternal(
        { uid: fromUid, targetUid: toUid },
        { auth: context.auth },
        tx,
      );
      matchId = res?.matchId || null;
    }

    tx.update(inviteRef, updates);
  });

  if (!matchId && fromUid && toUid) {
    const potentialId = [fromUid, toUid].sort().join('_');
    const matchRef = db.collection('matches').doc(potentialId);
    const matchSnap = await matchRef.get();
    if (matchSnap.exists) {
      matchId = potentialId;
    } else {
      const res = await createMatchIfMutualLikeInternal(
        { uid: fromUid, targetUid: toUid },
        { auth: context.auth },
      );
      matchId = res?.matchId || null;
    }
  }


  return { matchId };
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
  onMatchCreated,
  syncPresence,
  onUserProfileUpdate,
  autoStartGame,
  trackGameInvite,
  cleanupFinishedSession,
  onInviteDeleted,
  onMatchDeleted,
  onChatMessageCreated,
  acceptInvite,
};
