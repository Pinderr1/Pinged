import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from './UserContext';
import firebase from '../firebase';

const EventLimitContext = createContext();

export const EventLimitProvider = ({ children }) => {
  const { user } = useUser();
  const [eventsLeft, setEventsLeft] = useState(Infinity);
  const [limit, setLimit] = useState(Infinity);

  useEffect(() => {
    let cancelled = false;
    const fetchLimits = async () => {
      if (!user?.uid) return;
      try {
        const fn = firebase.functions().httpsCallable('getLimits');
        const res = await fn();
        if (!cancelled) {
          setEventsLeft(res.data.eventsLeft);
          setLimit(res.data.eventLimit);
        }
      } catch (e) {
        console.error('Failed to fetch event limits', e);
      }
    };
    fetchLimits();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const recordEventCreated = () => {
    setEventsLeft((prev) => (prev === Infinity ? Infinity : Math.max(prev - 1, 0)));
  };

  const value = { eventsLeft, limit, recordEventCreated };

  return (
    <EventLimitContext.Provider value={value}>
      {children}
    </EventLimitContext.Provider>
  );
};

export const useEventLimit = () => useContext(EventLimitContext);
