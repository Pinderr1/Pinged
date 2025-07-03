import React, { createContext, useState, useContext } from 'react';
import firebase from '../firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);

  const showNotification = (payload) => {
    const id = Date.now().toString();
    const notification =
      typeof payload === 'string' ? { id, title: payload } : { id, ...payload };
    setQueue((prev) => [...prev, notification]);
  };

  const removeNotification = (id) => {
    setQueue((prev) => prev.filter((n) => n.id !== id));
  };

  const dismissNotification = async (id) => {
    removeNotification(id);
    if (!user?.uid) return;
    try {
      await firebase
        .firestore()
        .collection('users')
        .doc(user.uid)
        .collection('notifications')
        .doc(id)
        .update({ read: true });
    } catch (e) {
      console.warn('Failed to dismiss notification', e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ queue, showNotification, removeNotification, dismissNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
export { NotificationContext };
