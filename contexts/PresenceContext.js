import React, { createContext, useContext, useEffect } from 'react';
import { AppState } from 'react-native';
import firebase, { auth, realtimeDB } from '../firebase';

const PresenceContext = createContext();

export const PresenceProvider = ({ children }) => {
  useEffect(() => {
    let statusRef;
    let appStateHandler;
    let appStateSubscription;
    const offline = {
      state: 'offline',
      last_changed: firebase.database.ServerValue.TIMESTAMP,
    };
    const online = {
      state: 'online',
      last_changed: firebase.database.ServerValue.TIMESTAMP,
    };

    const setup = (uid) => {
      statusRef = realtimeDB.ref('status/' + uid);
      const infoRef = realtimeDB.ref('.info/connected');
      infoRef.on('value', (snap) => {
        if (snap.val() === false) return;
        statusRef
          .onDisconnect()
          .set(offline)
          .then(() => {
            statusRef.set(online);
          });
      });
      appStateHandler = (state) => {
        if (state === 'active') {
          statusRef.set(online);
        } else {
          statusRef.set(offline);
        }
      };
      appStateSubscription = AppState.addEventListener('change', appStateHandler);
    };

    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
      if (statusRef) {
        statusRef.set(offline);
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
        statusRef.set(offline);
        if (appStateSubscription?.remove) {
          appStateSubscription.remove();
        }
      }
    };
  }, []);

  return <PresenceContext.Provider value={{}}>{children}</PresenceContext.Provider>;
};

export const usePresence = () => useContext(PresenceContext);
