import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser } from './UserContext';
import { fetchPremiumFlags } from '../services/premium';

const PremiumContext = createContext({ flags: {}, refresh: () => {} });

export const PremiumProvider = ({ children }) => {
  const { user } = useUser();
  const [flags, setFlags] = useState({});

  const loadFlags = useCallback(async () => {
    if (!user?.uid) {
      setFlags({});
      return;
    }
    const res = await fetchPremiumFlags();
    setFlags(res);
  }, [user?.uid]);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  return (
    <PremiumContext.Provider value={{ flags, refresh: loadFlags }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => useContext(PremiumContext);
