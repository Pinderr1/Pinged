import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import Loader from '../components/Loader';
import { lightTheme, darkTheme } from '../theme';
import { useUser } from './UserContext';

export const colorThemes = [
  {
    id: 'pinkOrange',
    name: 'Pink & Orange',
    gradientStart: '#FF75B5',
    gradientEnd: '#FF9A75',
    accent: '#FF75B5',
  },
  {
    id: 'purplePink',
    name: 'Purple',
    gradientStart: '#8B5CF6',
    gradientEnd: '#EC4899',
    accent: '#EC4899',
  },
  {
    id: 'teal',
    name: 'Teal',
    gradientStart: '#5EEAD4',
    gradientEnd: '#2DD4BF',
    accent: '#2DD4BF',
  },
  {
    id: 'sunny',
    name: 'Sunny',
    gradientStart: '#FDE68A',
    gradientEnd: '#F59E0B',
    accent: '#F59E0B',
  },
];

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
  const selected =
    colorThemes.find((c) => c.id === user?.colorTheme) || colorThemes[0];
  const theme = {
    ...baseTheme,
    accent: selected.accent,
    gradientStart: selected.gradientStart,
    gradientEnd: selected.gradientEnd,
    gradient: [selected.gradientStart, selected.gradientEnd],
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

export const COLOR_THEMES = colorThemes;
