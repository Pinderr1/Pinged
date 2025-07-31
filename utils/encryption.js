import AsyncStorage from '@react-native-async-storage/async-storage';
import sodium from 'libsodium-wrappers';

let ready = false;
async function ensureReady() {
  if (!ready) {
    await sodium.ready;
    ready = true;
  }
}

const KEY_PREFIX = 'encKey_';
const getKeyStorageKey = (uid) => `${KEY_PREFIX}${uid}`;

export async function getEncryptionKey(uid) {
  if (!uid) return null;
  let key = await AsyncStorage.getItem(getKeyStorageKey(uid));
  if (!key) {
    await ensureReady();
    const bytes = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
    key = sodium.to_base64(bytes);
    await AsyncStorage.setItem(getKeyStorageKey(uid), key);
  }
  return key;
}

export async function encryptText(text, key) {
  if (!text) return '';
  await ensureReady();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const cipher = sodium.crypto_secretbox_easy(
    sodium.from_string(text),
    nonce,
    sodium.from_base64(key)
  );
  return `${sodium.to_base64(nonce)}:${sodium.to_base64(cipher)}`;
}

export async function decryptText(ciphertext, key) {
  if (!ciphertext) return '';
  await ensureReady();
  const [n, c] = ciphertext.split(':');
  const plain = sodium.crypto_secretbox_open_easy(
    sodium.from_base64(c),
    sodium.from_base64(n),
    sodium.from_base64(key)
  );
  return sodium.to_string(plain);
}
