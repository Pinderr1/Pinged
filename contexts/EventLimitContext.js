import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { useUser } from './UserContext';
import useRemoteConfig from '../hooks/useRemoteConfig';
import firebase from '../firebase';

const EventLimitContext = createContext();
const DEFAULT_LIMIT = 1;

export const EventLimitProvider = ({ children }) => {
  const { user } = useUser();
  const { maxDailyEvents } = useRemoteConfig();
  const isPremium = !!user?.isPremium;
  const baseLimit = maxDailyEvents ?? DEFAULT_LIMIT;
  const limit = useMemo(
    () => (isPremium ? Infinity : baseLimit),
    [isPremium, baseLimit]
  );
  const [eventsLeft, setEventsLeft] = useState(limit);

  useEffect(() => {
    const dailyLimit = limit;
    if (limit === Infinity) {
      setEventsLeft(Infinity);
      return;
    }
    const last =
      user?.lastEventCreatedAt?.toDate?.() ||
      (user?.lastEventCreatedAt ? new Date(user.lastEventCreatedAt) : null);
    const today = new Date().toDateString();
    if (last && last.toDateString() === today) {
      setEventsLeft(Math.max(dailyLimit - (user.dailyEventCount || 0), 0));
    } else {
      setEventsLeft(dailyLimit);
    }
  }, [limit, user?.dailyEventCount, user?.lastEventCreatedAt]);

  const recordEventCreated = async (localOnly = false) => {
    if (limit === Infinity || !user?.uid) return;

    const last =
      user.lastEventCreatedAt?.toDate?.() ||
      (user.lastEventCreatedAt ? new Date(user.lastEventCreatedAt) : null);
    const today = new Date();
    let count = 1;
    if (last && last.toDateString() === today.toDateString()) {
      count = (user.dailyEventCount || 0) + 1;
    }
    const dailyLimit = limit;
    setEventsLeft(Math.max(dailyLimit - count, 0));
    if (localOnly) return;
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .update({
          dailyEventCount: count,
          lastEventCreatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    } catch (e) {
      console.error('Failed to update event count', e);
    }
  };

  return (
    <EventLimitContext.Provider value={{ eventsLeft, limit, recordEventCreated }}>
      {children}
    </EventLimitContext.Provider>
  );
};

export const useEventLimit = () => useContext(EventLimitContext);
