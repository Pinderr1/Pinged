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
): Promise<MSG[]> {
  const snap = await firebase
    .firestore()
    .collection('matches')
    .doc(matchId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const msgs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  return msgs; // descending order
}
