import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import Loader from '../components/Loader';
import { lightTheme, darkTheme } from '../theme';
import { PRESETS } from '../data/presets';
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

  const baseTheme = darkMode ? darkTheme : lightTheme;
  const preset = PRESETS.find((p) => p.id === user?.themePreset) || PRESETS[0];
  const theme = {
    ...baseTheme,
    accent: preset.accent,
    gradientStart: preset.gradientStart,
    gradientEnd: preset.gradientEnd,
    gradient: [preset.gradientStart, preset.gradientEnd],
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
