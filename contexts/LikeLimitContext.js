import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import useRemoteConfig from '../hooks/useRemoteConfig';
import firebase from '../firebase';
import analytics from '../utils/analytics';

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
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    firebase
      .firestore()
      .collection('likes')
      .doc(user?.uid || 'missing')
      .collection('liked')
      .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(start))
      .get()
      .then((snap) => {
        setLikesLeft(Math.max(dailyLimit - snap.size, 0));
      })
      .catch(() => setLikesLeft(dailyLimit));
  }, [isPremium, user?.uid, maxDailyLikes]);

  const recordLikeSent = () => {
    analytics.logEvent('swipe_right').catch(() => {});
    if (isPremium) return;
    setLikesLeft((prev) => (prev === Infinity ? Infinity : Math.max(prev - 1, 0)));
  };

  const recordSwipeLeft = () => {
    analytics.logEvent('swipe_left').catch(() => {});
  };

  return (
    <LikeLimitContext.Provider value={{ likesLeft, recordLikeSent, recordSwipeLeft }}>
      {children}
    </LikeLimitContext.Provider>
  );
};

export const useLikeLimit = () => useContext(LikeLimitContext);

