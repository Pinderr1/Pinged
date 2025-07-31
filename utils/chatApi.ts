import firebase from '../firebase';
import { decryptText } from './encryption';

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
}

export async function getMessages(
  matchId: string,
  limit = 30,
  key?: string
): Promise<{ messages: MSG[]; lastDoc: firebase.firestore.DocumentSnapshot | null }> {
  const snap = await firebase
    .firestore()
    .collection('matches')
    .doc(matchId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const messages = await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data() as any;
      if (data.text && key) {
        data.text = await decryptText(data.text, key);
      }
      return { id: d.id, ...data };
    })
  );
  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  return { messages, lastDoc }; // descending order
}
