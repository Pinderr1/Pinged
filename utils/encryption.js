import AsyncStorage from '@react-native-async-storage/async-storage';
import sodium from 'libsodium-wrappers';

const STORAGE_KEY_PREFIX = 'asym_keypair_';
const REMOTE_KEY_PREFIX = 'remote_pubkey_';
let keyPair = null;
let ready = null;
let currentUid = null;
const publicKeyCache = {};

async function loadKeyPair(uid) {
  const stored = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${uid}`);
  if (stored) {
    const parsed = JSON.parse(stored);
    return {
      publicKey: sodium.from_base64(parsed.publicKey),
      privateKey: sodium.from_base64(parsed.privateKey),
    };
  }
  const generated = sodium.crypto_box_keypair();
  await AsyncStorage.setItem(
    `${STORAGE_KEY_PREFIX}${uid}`,
    JSON.stringify({
      publicKey: sodium.to_base64(generated.publicKey),
      privateKey: sodium.to_base64(generated.privateKey),
    }),
  );
  return generated;
}

export async function initEncryption(uid) {
  if (!uid) return;
  if (!ready) {
    ready = sodium.ready;
  }
  await ready;
  if (currentUid !== uid) {
    currentUid = uid;
    keyPair = null;
    Object.keys(publicKeyCache).forEach((k) => delete publicKeyCache[k]);
  }
  if (!keyPair) {
    keyPair = await loadKeyPair(uid);
  }
}

async function getPublicKey(uid) {
  if (uid === currentUid && keyPair) return keyPair.publicKey;
  if (publicKeyCache[uid]) return publicKeyCache[uid];
  const stored = await AsyncStorage.getItem(`${REMOTE_KEY_PREFIX}${uid}`);
  if (stored) {
    const bytes = sodium.from_base64(stored);
    publicKeyCache[uid] = bytes;
    return bytes;
  }
  return null;
}

export async function saveRemotePublicKey(uid, keyBase64) {
  try {
    publicKeyCache[uid] = sodium.from_base64(keyBase64);
    await AsyncStorage.setItem(`${REMOTE_KEY_PREFIX}${uid}`, keyBase64);
  } catch (e) {
    console.warn('Failed to save remote public key', e);
  }
}

export function getPublicKeyBase64() {
  return keyPair ? sodium.to_base64(keyPair.publicKey) : null;
}

export async function encryptText(text, recipientUid) {
  if (!keyPair) {
    throw new Error('Encryption not initialized');
  }
  const recipientKey = await getPublicKey(recipientUid);
  if (!recipientKey) {
    throw new Error('Recipient public key not found');
  }
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const cipher = sodium.crypto_box_easy(
    sodium.from_string(text),
    nonce,
    recipientKey,
    keyPair.privateKey,
  );
  return {
    ciphertext: sodium.to_base64(cipher),
    nonce: sodium.to_base64(nonce),
  };
}

export async function decryptText(ciphertext, nonce, senderUid) {
  if (!keyPair) {
    return '';
  }
  try {
    const senderKey = await getPublicKey(senderUid);
    if (!senderKey) return '';
    const plain = sodium.crypto_box_open_easy(
      sodium.from_base64(ciphertext),
      sodium.from_base64(nonce),
      senderKey,
      keyPair.privateKey,
    );
    return sodium.to_string(plain);
  } catch (e) {
    console.warn('Failed to decrypt text', e);
    return '';
  }
}
