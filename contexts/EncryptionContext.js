import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import sodium from 'libsodium-wrappers';
import {
  generateKeyPair,
  encryptText as encryptHelper,
  decryptText as decryptHelper,
} from '../utils/encryption';

const EncryptionContext = createContext(null);

export const EncryptionProvider = ({ children }) => {
  const [keyPair, setKeyPair] = useState(null);
  const publicKeyCacheRef = useRef({});
  const currentUidRef = useRef(null);
  const readyRef = useRef(null);

  const initEncryption = useCallback(
    async (uid) => {
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
    },
    [keyPair],
  );

  const encryptText = useCallback(
    (text, recipientUid) =>
      encryptHelper(text, recipientUid, keyPair, publicKeyCacheRef.current, currentUidRef.current),
    [keyPair],
  );

  const decryptText = useCallback(
    (cipher, nonce, senderUid) =>
      decryptHelper(cipher, nonce, senderUid, keyPair, publicKeyCacheRef.current, currentUidRef.current),
    [keyPair],
  );

  const value = {
    keyPair,
    publicKeyCache: publicKeyCacheRef.current,
    initEncryption,
    encryptText,
    decryptText,
  };

  return <EncryptionContext.Provider value={value}>{children}</EncryptionContext.Provider>;
};

export const useEncryption = () => useContext(EncryptionContext);

