import React, { createContext, useContext, useEffect } from 'react';
import { AppState } from 'react-native';
import { auth, database } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';

const PresenceContext = createContext();

export const PresenceProvider = ({ children }) => {
  useEffect(() => {
    let statusRef;
    let appStateHandler;
    let appStateSubscription;
    const offline = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };
    const online = {
      state: 'online',
      last_changed: serverTimestamp(),
    };

    const setup = (uid) => {
      statusRef = ref(database, 'status/' + uid);
      const infoRef = ref(database, '.info/connected');
      onValue(infoRef, (snap) => {
        if (snap.val() === false) return;
        onDisconnect(statusRef).set(offline).then(() => {
          set(statusRef, online);
        });
      });
      appStateHandler = (state) => {
        if (state === 'active') {
          set(statusRef, online);
        } else {
          set(statusRef, offline);
        }
      };
      appStateSubscription = AppState.addEventListener('change', appStateHandler);
    };

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (statusRef) {
        set(statusRef, offline);
        if (appStateSubscription?.remove) {
          appStateSubscription.remove();
        }
        statusRef = null;
      }
      if (fbUser) setup(fbUser.uid);
    });

    return () => {
      unsubscribe();
      if (statusRef) {
        set(statusRef, offline);
        if (appStateSubscription?.remove) {
          appStateSubscription.remove();
        }
      }
    };
  }, []);

  return <PresenceContext.Provider value={{}}>{children}</PresenceContext.Provider>;
};

export const usePresence = () => useContext(PresenceContext);
