import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from './UserContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);

  const { user } = useUser();

  useEffect(() => {
    if (!user?.uid) {
      setUnseenCount(0);
      return;
    }
    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      where('seen', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnseenCount(snap.size);
    });
    return unsub;
  }, [user?.uid]);

  const showNotification = (message) => {
    setNotification(message);
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
      setNotification(null);
    }, 3000);
  };

  const markAllSeen = async () => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(db, 'users', user.uid, 'notifications'),
        where('seen', '==', false)
      );
      const snap = await getDocs(q);
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.forEach((d) => batch.update(d.ref, { seen: true }));
      await batch.commit();
    } catch (e) {
      console.warn('Failed to mark notifications seen', e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notification, visible, showNotification, unseenCount, markAllSeen }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
export { NotificationContext };
