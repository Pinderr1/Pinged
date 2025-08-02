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
    if (isPremium || !user?.uid) {
      setLikesLeft(Infinity);
    } else {
      setLikesLeft(limit);
    }
  }, [isPremium, user?.uid, limit]);

  const sendLike = async (targetUid) => {
    if (!targetUid) return { success: false, matchId: null };
    try {
      const res = await firebase
        .functions()
        .httpsCallable('likeAndMaybeMatch')({ targetUid });
      if (!isPremium) {
        setLikesLeft((prev) =>
          prev === Infinity ? Infinity : Math.max(prev - 1, 0)
        );
      }
      return { success: true, matchId: res?.data?.matchId || null };
    } catch (e) {
      if (!isPremium && e?.message?.includes('Daily like limit')) {
        setLikesLeft(0);
      }
      throw e;
    }
  };

  return (
    <LikeLimitContext.Provider value={{ likesLeft, sendLike }}>
      {children}
    </LikeLimitContext.Provider>
  );
};

export const useLikeLimit = () => useContext(LikeLimitContext);

