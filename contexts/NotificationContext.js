import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
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

  return (
    <NotificationContext.Provider
      value={{ queue, showNotification, removeNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
export { NotificationContext };
