import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import useRemoteConfig from '../hooks/useRemoteConfig';
import firebase from '../firebase';
import { isSameResetPeriod } from '../utils/resetPeriod';

const EventLimitContext = createContext();

export const EventLimitProvider = ({ children }) => {
  const { user } = useUser();
  const { maxDailyEvents, resetHour, timezonePolicy } = useRemoteConfig();
  const isPremium = !!user?.isPremium;
  const baseLimit = Number.isFinite(maxDailyEvents) ? maxDailyEvents : Infinity;
  const limit = isPremium ? Infinity : baseLimit;
  const [eventsLeft, setEventsLeft] = useState(limit);

  useEffect(() => {
    const dailyLimit = limit;
    if (isPremium || !Number.isFinite(dailyLimit)) {
      setEventsLeft(Infinity);
      return;
    }
    const last =
      user?.lastEventCreatedAt?.toDate?.() ||
      (user?.lastEventCreatedAt ? new Date(user.lastEventCreatedAt) : null);
    const now = new Date();
    if (last && isSameResetPeriod(last, now, resetHour, timezonePolicy)) {
      setEventsLeft(Math.max(dailyLimit - (user.dailyEventCount || 0), 0));
    } else {
      setEventsLeft(dailyLimit);
    }
  }, [
    isPremium,
    user?.dailyEventCount,
    user?.lastEventCreatedAt,
    baseLimit,
    limit,
    resetHour,
    timezonePolicy,
  ]);

  const recordEventCreated = async (localOnly = false) => {
    if (isPremium || !user?.uid) return;

    const last =
      user.lastEventCreatedAt?.toDate?.() ||
      (user.lastEventCreatedAt ? new Date(user.lastEventCreatedAt) : null);
    const now = new Date();
    let count = 1;
    if (last && isSameResetPeriod(last, now, resetHour, timezonePolicy)) {
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

  const value = { eventsLeft, limit, recordEventCreated };

  return (
    <EventLimitContext.Provider value={value}>
      {children}
    </EventLimitContext.Provider>
  );
};

export const useEventLimit = () => useContext(EventLimitContext);
