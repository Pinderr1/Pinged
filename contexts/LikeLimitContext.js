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
      .firestore()
      .collection('limits')
      .doc(user?.uid || 'missing')
      .get()
      .then((snap) => {
        const updated = snap.get('dailyLikesUpdatedAt');
        const count = snap.get('dailyLikes') || 0;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const used = updated?.toDate?.() >= start ? count : 0;
        setLikesLeft(Math.max(dailyLimit - used, 0));
      })
      .catch(() => setLikesLeft(dailyLimit));
  }, [isPremium, user?.uid, maxDailyLikes]);

  const recordLikeSent = () => {
    if (isPremium) return;
    setLikesLeft((prev) => (prev === Infinity ? Infinity : Math.max(prev - 1, 0)));
  };

  return (
    <LikeLimitContext.Provider value={{ likesLeft, recordLikeSent }}>
      {children}
    </LikeLimitContext.Provider>
  );
};

export const useLikeLimit = () => useContext(LikeLimitContext);

