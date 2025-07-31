import React, { createContext, useContext, useEffect, useState } from 'react';
import { useListeners } from './ListenerContext';
import { useUser } from './UserContext';

const PresenceContext = createContext();

export const PresenceProvider = ({ children }) => {
  const { matches } = useListeners();
  const { user } = useUser();
  const [presenceMap, setPresenceMap] = useState({});

  useEffect(() => {
    if (!user?.uid) return;
    const map = {};
    matches.forEach((m) => {
      const otherId = Array.isArray(m.users) ? m.users.find((u) => u !== user.uid) : null;
      if (otherId && m.presence && m.presence[otherId]) {
        map[otherId] = m.presence[otherId];
      }
    });
    setPresenceMap(map);
  }, [matches, user?.uid]);

  const getPresence = (uid) => presenceMap[uid] || null;

  return (
    <PresenceContext.Provider value={{ presence: presenceMap, getPresence }}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);
