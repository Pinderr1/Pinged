import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import firebase from '../firebase';

const LikeLimitContext = createContext();

export const LikeLimitProvider = ({ children }) => {
  const { user } = useUser();
  const [likesLeft, setLikesLeft] = useState(Infinity);

  useEffect(() => {
    let cancelled = false;
    const fetchLimits = async () => {
      if (!user?.uid) return;
      try {
        const fn = firebase.functions().httpsCallable('getLimits');
        const res = await fn();
        if (!cancelled) setLikesLeft(res.data.likesLeft);
      } catch (e) {
        console.warn('Failed to fetch like limits', e);
      }
    };
    fetchLimits();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const recordLikeSent = () => {
    setLikesLeft((prev) => (prev === Infinity ? Infinity : Math.max(prev - 1, 0)));
  };

  return (
    <LikeLimitContext.Provider value={{ likesLeft, recordLikeSent }}>
      {children}
    </LikeLimitContext.Provider>
  );
};

export const useLikeLimit = () => useContext(LikeLimitContext);

