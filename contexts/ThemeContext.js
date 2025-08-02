import React from 'react';
import { View } from 'react-native';
import Loader from '../components/Loader';
import { lightTheme, darkTheme } from '../theme';
import { useUser } from './UserContext';
import {
  useAppStore,
  selectDarkMode,
  selectToggleTheme,
  selectHydrated,
} from '../state/appStore';

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

export const ThemeProvider = ({ children }) => {
  const loaded = useAppStore(selectHydrated);
  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Loader />
      </View>
    );
  }
  return <>{children}</>;
};

export const useTheme = () => {
  const darkMode = useAppStore(selectDarkMode);
  const toggleTheme = useAppStore(selectToggleTheme);
  const loaded = useAppStore(selectHydrated);
  const { user } = useUser();
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
  return { darkMode, toggleTheme, theme, loaded };
};

export const COLOR_THEMES = colorThemes;
