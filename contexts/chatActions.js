import firebase from '../firebase';

const chatActions = {
  async deleteMessage(matchId, messageId, opts = {}) {
    if (!matchId || !messageId) return;
    const base = opts.group ? 'events' : 'matches';
    try {
      await firebase
        .firestore()
        .collection(base)
        .doc(matchId)
        .collection('messages')
        .doc(messageId)
        .delete();
    } catch (e) {
      console.warn('Failed to delete message', e);
    }
  },

  async pinMessage(matchId, messageId, pin = true, opts = {}) {
    if (!matchId || !messageId) return;
    const base = opts.group ? 'events' : 'matches';
    try {
      await firebase
        .firestore()
        .collection(base)
        .doc(matchId)
        .collection('messages')
        .doc(messageId)
        .update({ pinned: pin });
    } catch (e) {
      console.warn('Failed to pin message', e);
    }
  },

  async sendReaction(matchId, messageId, userId, emoji, opts = {}) {
    if (!matchId || !messageId || !userId) return;
    const base = opts.group ? 'events' : 'matches';
    const field = `reactions.${userId}`;
    try {
      await firebase
        .firestore()
        .collection(base)
        .doc(matchId)
        .collection('messages')
        .doc(messageId)
        .update(
          emoji
            ? { [field]: emoji }
            : { [field]: firebase.firestore.FieldValue.delete() }
        );
    } catch (e) {
      console.warn('Failed to send reaction', e);
    }
  },
};

export default chatActions;
