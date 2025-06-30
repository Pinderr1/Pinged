import { Platform } from 'react-native';

export const FONT_SIZES = {
  title: 24,
  label: 16,
  text: 14,
};

export const BUTTON_STYLE = {
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
};

export const HEADER_HEIGHT = 60;
export const HEADER_SPACING = Platform.OS === 'ios' ? HEADER_HEIGHT + 40 : HEADER_HEIGHT + 20;

export const lightTheme = {
  background: '#ffffff',
  card: '#ffffff',
  text: '#222222',
  textSecondary: '#666666',
  accent: '#d81b60',
  gradientStart: '#FF75B5',
  gradientEnd: '#FF9A75',
  headerBackground: '#ffffff',
};

export const darkTheme = {
  background: '#121212',
  card: '#1E1E1E',
  text: '#E0E0E0',
  textSecondary: '#AAAAAA',
  accent: '#BB86FC',
  gradientStart: '#5a189a',
  gradientEnd: '#240046',
  headerBackground: '#1E1E1E',
};

