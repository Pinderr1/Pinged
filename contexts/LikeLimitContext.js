import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import useRemoteConfig from '../hooks/useRemoteConfig';

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
    if (isPremium) {
      setLikesLeft(Infinity);
      return;
    }
    const last =
      user?.lastLikeSentAt?.toDate?.() ||
      (user?.lastLikeSentAt ? new Date(user.lastLikeSentAt) : null);
    const today = new Date().toDateString();
    if (last && last.toDateString() === today) {
      setLikesLeft(Math.max(dailyLimit - (user.dailyLikeCount || 0), 0));
    } else {
      setLikesLeft(dailyLimit);
    }
  }, [isPremium, user?.dailyLikeCount, user?.lastLikeSentAt, maxDailyLikes]);

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

