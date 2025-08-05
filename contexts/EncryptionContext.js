import React, { createContext, useContext, useRef, useState } from 'react';
import sodium from 'libsodium-wrappers';
import {
  generateKeyPair,
  encryptText as utilEncryptText,
  decryptText as utilDecryptText,
  saveRemotePublicKey as utilSaveRemotePublicKey,
  getPublicKeyBase64 as utilGetPublicKeyBase64,
} from '../utils/encryption';

const EncryptionContext = createContext(null);

export const EncryptionProvider = ({ children }) => {
  const [keyPair, setKeyPair] = useState(null);
  const publicKeyCacheRef = useRef({});
  const readyRef = useRef(null);
  const currentUidRef = useRef(null);

  const initEncryption = async (uid) => {
    if (!uid) return;
    if (!readyRef.current) {
      readyRef.current = sodium.ready;
    }
    await readyRef.current;
    if (currentUidRef.current !== uid) {
      currentUidRef.current = uid;
      setKeyPair(null);
      publicKeyCacheRef.current = {};
    }
    if (!keyPair) {
      const kp = await generateKeyPair(uid);
      setKeyPair(kp);
    }
  };

  const encryptText = async (text, recipientUid) => {
    if (!keyPair) {
      throw new Error('Encryption not initialized');
    }
    return utilEncryptText(text, recipientUid, {
      keyPair,
      currentUid: currentUidRef.current,
      publicKeyCache: publicKeyCacheRef.current,
    });
  };

  const decryptText = async (cipher, nonce, senderUid) => {
    if (!keyPair) return '';
    return utilDecryptText(cipher, nonce, senderUid, {
      keyPair,
      currentUid: currentUidRef.current,
      publicKeyCache: publicKeyCacheRef.current,
    });
  };

  const saveRemotePublicKey = async (uid, keyBase64) =>
    utilSaveRemotePublicKey(uid, keyBase64, publicKeyCacheRef.current);

  const getPublicKeyBase64 = () => utilGetPublicKeyBase64(keyPair);

  return (
    <EncryptionContext.Provider
      value={{
        initEncryption,
        encryptText,
        decryptText,
        saveRemotePublicKey,
        getPublicKeyBase64,
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
};

export const useEncryption = () => useContext(EncryptionContext);

