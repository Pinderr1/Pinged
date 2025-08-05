import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import useRemoteConfig from '../hooks/useRemoteConfig';
import firebase from '../firebase';

const EventLimitContext = createContext();
const DEFAULT_LIMIT = 1;

export const EventLimitProvider = ({ children }) => {
  const { user } = useUser();
  const { maxDailyEvents } = useRemoteConfig();
  const isPremium = !!user?.isPremium;
  const limit = maxDailyEvents ?? DEFAULT_LIMIT;
  const [eventsLeft, setEventsLeft] = useState(isPremium ? Infinity : limit);

  useEffect(() => {
    const dailyLimit = maxDailyEvents ?? DEFAULT_LIMIT;
    if (isPremium) {
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
  }, [isPremium, user?.dailyEventCount, user?.lastEventCreatedAt, maxDailyEvents]);

  const recordEventCreated = async (localOnly = false) => {
    if (isPremium || !user?.uid) return;

    const last =
      user.lastEventCreatedAt?.toDate?.() ||
      (user.lastEventCreatedAt ? new Date(user.lastEventCreatedAt) : null);
    const today = new Date();
    let count = 1;
    if (last && last.toDateString() === today.toDateString()) {
      count = (user.dailyEventCount || 0) + 1;
    }
    const dailyLimit = maxDailyEvents ?? DEFAULT_LIMIT;
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
