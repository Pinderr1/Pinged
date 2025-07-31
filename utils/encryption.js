import AsyncStorage from '@react-native-async-storage/async-storage';
import sodium from 'libsodium-wrappers';

const STORAGE_KEY = 'msg_enc_key';
let keyBytes = null;
let ready = null;

export async function initEncryption() {
  if (!ready) {
    ready = sodium.ready;
  }
  await ready;
  if (!keyBytes) {
    let stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const bytes = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
      stored = sodium.to_base64(bytes);
      await AsyncStorage.setItem(STORAGE_KEY, stored);
    }
    keyBytes = sodium.from_base64(stored);
  }
}

export function encryptText(text) {
  if (!keyBytes) {
    throw new Error('Encryption not initialized');
  }
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const cipher = sodium.crypto_secretbox_easy(
    sodium.from_string(text),
    nonce,
    keyBytes,
  );
  return {
    ciphertext: sodium.to_base64(cipher),
    nonce: sodium.to_base64(nonce),
  };
}

export function decryptText(ciphertext, nonce) {
  if (!keyBytes) {
    return '';
  }
  try {
    const plain = sodium.crypto_secretbox_open_easy(
      sodium.from_base64(ciphertext),
      sodium.from_base64(nonce),
      keyBytes,
    );
    return sodium.to_string(plain);
  } catch (e) {
    console.warn('Failed to decrypt text', e);
    return '';
  }
}
