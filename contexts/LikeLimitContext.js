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
    setLikesLeft(isPremium ? Infinity : limit);
  }, [isPremium, limit]);

  const sendLike = async (targetUid) => {
    if (!user?.uid || !targetUid) return {};
    try {
      const callable = firebase.functions().httpsCallable('sendLike');
      const res = await callable({ uid: user.uid, targetUid });
      const remaining = res?.data?.remainingLikes;
      if (Number.isFinite(remaining)) setLikesLeft(remaining);
      return res.data || {};
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

