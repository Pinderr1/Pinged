import React, { createContext, useContext, useState } from 'react';
import log from '../utils/logger';

const DevContext = createContext();

export const DevProvider = ({ children }) => {
  const [devMode, setDevMode] = useState(false);
  const toggleDevMode = () => {
    if (!__DEV__) return;
    setDevMode((prev) => {
      const next = !prev;
      log(`Dev mode ${next ? 'enabled' : 'disabled'}`);
      return next;
    });
  };

  return (
    <DevContext.Provider value={{ devMode: __DEV__ ? devMode : false, toggleDevMode }}>
      {children}
    </DevContext.Provider>
  );
};

export const useDev = () => useContext(DevContext);
