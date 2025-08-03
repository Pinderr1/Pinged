import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import useRemoteConfig from '../hooks/useRemoteConfig';
import firebase from '../firebase';

const LikeLimitContext = createContext();
const DEFAULT_LIMIT = 100;

export const LikeLimitProvider = ({ children }) => {
  const { user } = useUser();
  const { maxDailyLikes } = useRemoteConfig();
  const isPremium = !!user?.isPremium;
  const limit = maxDailyLikes ?? DEFAULT_LIMIT;
  const [likesLeft, setLikesLeft] = useState(isPremium ? Infinity : limit);

  useEffect(() => {
    const dailyLimit = maxDailyLikes ?? DEFAULT_LIMIT;
    if (isPremium || !user?.uid) {
      setLikesLeft(Infinity);
      return;
    }
    firebase
      .functions()
      .httpsCallable('getLikesRemaining')()
      .then((res) => {
        const left = res?.data?.likesLeft;
        setLikesLeft(
          typeof left === 'number' ? left : dailyLimit
        );
      })
      .catch(() => setLikesLeft(dailyLimit));
  }, [isPremium, user?.uid, maxDailyLikes]);

  const recordLikeSent = () => {
    if (isPremium) return;
    firebase
      .functions()
      .httpsCallable('getLikesRemaining')()
      .then((res) => {
        const left = res?.data?.likesLeft;
        if (typeof left === 'number') {
          setLikesLeft(left);
        }
      })
      .catch(() => {});
  };

  return (
    <LikeLimitContext.Provider value={{ likesLeft, recordLikeSent }}>
      {children}
    </LikeLimitContext.Provider>
  );
};

export const useLikeLimit = () => useContext(LikeLimitContext);

