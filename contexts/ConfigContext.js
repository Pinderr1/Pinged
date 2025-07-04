import React, { createContext, useContext, useEffect, useState } from 'react';
import firebase from '../firebase';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection('config')
      .doc('app')
      .onSnapshot(
        (doc) => {
          setConfig(doc.data() || {});
          setLoading(false);
        },
        (e) => {
          console.warn('Failed to load app config', e);
          setLoading(false);
        }
      );
    return unsub;
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useAppConfig = () => useContext(ConfigContext);
