import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { useUser } from './UserContext';
import useRemoteConfig from '../hooks/useRemoteConfig';

const LikeLimitContext = createContext();
const DEFAULT_LIMIT = 100;

export const LikeLimitProvider = ({ children }) => {
  const { user } = useUser();
  const { maxDailyLikes } = useRemoteConfig();
  const isPremium = !!user?.isPremium;
  const limit = useMemo(
    () => maxDailyLikes ?? DEFAULT_LIMIT,
    [maxDailyLikes],
  );
  const [likesLeft, setLikesLeft] = useState(
    isPremium ? Infinity : limit,
  );

  useEffect(() => {
    if (isPremium) {
      setLikesLeft(Infinity);
      return;
    }
    const last =
      user?.lastLikeSentAt?.toDate?.() ||
      (user?.lastLikeSentAt ? new Date(user.lastLikeSentAt) : null);
    const today = new Date().toDateString();
    if (last && last.toDateString() === today) {
      setLikesLeft(Math.max(limit - (user.dailyLikeCount || 0), 0));
    } else {
      setLikesLeft(limit);
    }
  }, [isPremium, user?.dailyLikeCount, user?.lastLikeSentAt, limit]);

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

