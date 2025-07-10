const { functions, admin, pushToUser, ensureMatchHistory } = require('./utils');

exports.onGameInviteCreated = functions.firestore
  .document('gameInvites/{inviteId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data || !data.to) return null;
    try {
      await pushToUser(
        data.to,
        'Game Invite',
        `${data.fromName || 'Someone'} invited you to play`,
        { type: 'invite', inviteId: snap.id, gameId: data.gameId }
      );
    } catch (e) {
      console.error('Failed to send invite notification', e);
    }
    return null;
  });

exports.resetFreeGameUsage = functions.pubsub
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

exports.onMatchCreated = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data || !Array.isArray(data.users)) return null;
    await ensureMatchHistory(data.users);
    await Promise.all(
      data.users.map((uid) =>
        pushToUser(uid, 'New Match', 'You have a new match!', {
          type: 'match',
          matchId: snap.id,
        }).catch((e) => console.error('Failed to send match notification', e))
      )
    );
    return null;
  });

exports.autoStartGame = functions.firestore
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
          .catch((e) => console.error('Failed to update sender invite', e))
      );
      tasks.push(
        pushToUser(after.from, 'Game Starting', 'Your game is starting!', {
          type: 'game',
          inviteId,
        }).catch((e) => console.error('Failed to push to sender', e))
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
          .catch((e) => console.error('Failed to update recipient invite', e))
      );
      tasks.push(
        pushToUser(after.to, 'Game Starting', 'Your game is starting!', {
          type: 'game',
          inviteId,
        }).catch((e) => console.error('Failed to push to recipient', e))
      );
    }

    await Promise.all(tasks);
    return null;
  });

exports.trackGameInvite = functions.firestore
  .document('gameInvites/{inviteId}')
  .onUpdate(async (change) => {
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

exports.autoStartLobby = functions.firestore
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
        }).catch((e) => console.error('Failed to push to user', e))
      )
    );

    await Promise.all(tasks);
    return null;
  });
