import React, { createContext, useContext, useState, useEffect } from 'react';
import { logDev } from '../utils/logger';

const DevContext = createContext();

export const DevProvider = ({ children }) => {
  const [devMode, setDevMode] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) =>
    setLogs((prev) => [...prev.slice(-99), msg]);
  const toggleDevMode = () => {
    setDevMode((prev) => {
      const next = !prev;
      logDev(`Dev mode ${next ? 'enabled' : 'disabled'}`);
      return next;
    });
  };

  useEffect(() => {
    if (!devMode) return undefined;
    const origWarn = console.warn;
    const origError = console.error;
    console.warn = (...args) => {
      addLog(`WARN: ${args.join(' ')}`);
      origWarn(...args);
    };
    console.error = (...args) => {
      addLog(`ERROR: ${args.join(' ')}`);
      origError(...args);
    };
    return () => {
      console.warn = origWarn;
      console.error = origError;
    };
  }, [devMode]);

  const clearLogs = () => setLogs([]);

  return (
    <DevContext.Provider value={{ devMode, toggleDevMode, logs, clearLogs }}>
      {children}
    </DevContext.Provider>
  );
};

export const useDev = () => useContext(DevContext);
