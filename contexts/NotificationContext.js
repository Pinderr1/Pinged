import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);

  const showNotification = (message) => {
    setNotification(message);
    setVisible(true);
    setTimeout(() => {
      setVisible(false);
      setNotification(null);
    }, 3000);
  };

  return (
    <NotificationContext.Provider value={{ notification, visible, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
export { NotificationContext };
