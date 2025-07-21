import firebase from '../firebase';

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
  limit = 30
): Promise<{ messages: MSG[]; lastDoc: firebase.firestore.DocumentSnapshot | null }> {
  const snap = await firebase
    .firestore()
    .collection('matches')
    .doc(matchId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const messages = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;
  return { messages, lastDoc }; // descending order
}
