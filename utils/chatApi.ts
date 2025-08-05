import firebase from '../firebase';
import { useEncryption } from '../contexts/EncryptionContext';

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

export function useChatApi() {
  const { decryptText, saveRemotePublicKey } = useEncryption();

  const getMessages = async (
    matchId: string,
    currentUid: string,
    startAfter?: firebase.firestore.DocumentSnapshot | null,
    limit = 30,
    fromArchive = false,
  ): Promise<{ messages: MSG[]; lastDoc: firebase.firestore.DocumentSnapshot | null }> => {
    let query = firebase
      .firestore()
      .collection('matches')
      .doc(matchId)
      .collection(fromArchive ? 'messages_archive' : 'messages')
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
  };

  return { getMessages };
}
