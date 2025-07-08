import { Platform } from 'react-native';

export const FONT_SIZES = {
  XL: 24,
  LG: 18,
  MD: 16,
  SM: 14,
};

export const BUTTON_STYLE = {
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
};

export const HEADER_HEIGHT = 60;
export const HEADER_SPACING = Platform.OS === 'ios'
  ? HEADER_HEIGHT + 40
  : HEADER_HEIGHT + 20;

