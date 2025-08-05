import firebase from '../firebase';
import { decryptText, initEncryption, saveRemotePublicKey } from './encryption';

export interface MSG {
  id: string;
  text?: string;
  senderId?: string;
  timestamp?: any;
  readBy?: string[];
  reactions?: Record<string, string>;
  voice?: boolean;
  url?: string;
  duration?: number;
  publicKey?: string;
}

export async function getMessages(
  matchId: string,
  currentUid: string,
  startAfter?: firebase.firestore.DocumentSnapshot | null,
  limit = 30,
): Promise<{ messages: MSG[]; lastDoc: firebase.firestore.DocumentSnapshot | null }> {
  await initEncryption(currentUid);
  let query = firebase
    .firestore()
    .collection('matches')
    .doc(matchId)
    .collection('messages')
    .orderBy('timestamp', 'desc');

  if (startAfter) {
    query = query.startAfter(startAfter);
  }

  const snap = await query.limit(limit).get();

  const messages = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data() as any;
      if (data.publicKey && data.senderId) {
        await saveRemotePublicKey(data.senderId, data.publicKey);
        return null;
      }
      if (!data.text && data.ciphertext && data.nonce && data.senderId) {
        data.text = await decryptText(data.ciphertext, data.nonce, data.senderId);
      }
      return { id: d.id, ...data };
    }),
  );
  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  return { messages: messages.filter(Boolean) as MSG[], lastDoc }; // descending order
}
