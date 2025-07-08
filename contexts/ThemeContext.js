import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import Loader from '../components/Loader';
import { lightTheme, darkTheme } from '../theme';
import { useUser } from './UserContext';

const ThemeContext = createContext();
const STORAGE_KEY = 'darkMode';

export const ThemeProvider = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        if (isMounted) setDarkMode(val === 'true');
      })
      .finally(() => {
        if (isMounted) setLoaded(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTheme = async () => {
    const next = !darkMode;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next.toString());
    } catch (e) {
      console.warn('Failed to persist dark mode', e);
    }
    setDarkMode(next);
  };

  const base = darkMode ? darkTheme : lightTheme;
  const overrides = user?.themeColors || {};
  const theme = {
    ...base,
    ...overrides,
    gradient: [
      overrides.gradientStart || base.gradientStart,
      overrides.gradientEnd || base.gradientEnd,
    ],
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, theme, loaded }}>
      {loaded ? (
        children
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Loader />
        </View>
      )}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
