import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { useUser } from './UserContext';
import useRemoteConfig from '../hooks/useRemoteConfig';
import { isSameResetPeriod } from '../utils/resetPeriod';

const LikeLimitContext = createContext();

export const LikeLimitProvider = ({ children }) => {
  const { user } = useUser();
  const { maxDailyLikes, resetHour, timezonePolicy } = useRemoteConfig();
  const isPremium = !!user?.isPremium;
  const limit = Number.isFinite(maxDailyLikes) ? maxDailyLikes : Infinity;
  const [likesLeft, setLikesLeft] = useState(isPremium ? Infinity : limit);

  useEffect(() => {
    if (isPremium || !Number.isFinite(limit)) {
      setLikesLeft(Infinity);
      return;
    }
    const last =
      user?.lastLikeSentAt?.toDate?.() ||
      (user?.lastLikeSentAt ? new Date(user.lastLikeSentAt) : null);
    const now = new Date();
    if (last && isSameResetPeriod(last, now, resetHour, timezonePolicy)) {
      setLikesLeft(Math.max(limit - (user.dailyLikeCount || 0), 0));
    } else {
      setLikesLeft(limit);
    }
  }, [
    isPremium,
    user?.dailyLikeCount,
    user?.lastLikeSentAt,
    limit,
    resetHour,
    timezonePolicy,
  ]);

  const recordLikeSent = () => {
    if (isPremium || !Number.isFinite(limit)) return;
    setLikesLeft((prev) =>
      prev === Infinity ? Infinity : Math.max(prev - 1, 0)
    );
  };

  return (
    <LikeLimitContext.Provider value={{ likesLeft, recordLikeSent }}>
      {children}
    </LikeLimitContext.Provider>
  );
};

export const useLikeLimit = () => useContext(LikeLimitContext);

