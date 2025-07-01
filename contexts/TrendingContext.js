import React, { createContext, useContext, useEffect, useState } from 'react';
import firebase from '../firebase';

const TrendingContext = createContext();

export const TrendingProvider = ({ children }) => {
  const [trendingMap, setTrendingMap] = useState({});

  useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection('games')
      .onSnapshot(
        (snap) => {
          const map = {};
          snap.docs.forEach((d) => {
            const data = d.data() || {};
            if (data.trending) {
              const id = data.id || d.id;
              map[id] = true;
            }
          });
          setTrendingMap(map);
        },
        (e) => console.warn('Failed to load trending games', e)
      );
    return unsub;
  }, []);

  return (
    <TrendingContext.Provider value={{ trendingMap }}>
      {children}
    </TrendingContext.Provider>
  );
};

export const useTrending = () => useContext(TrendingContext);
