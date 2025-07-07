import { StyleSheet, Platform } from 'react-native';
import { FONT_SIZES } from './layout';

const defaultFont = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const FONT_FAMILY = {
  regular: defaultFont,
  medium: defaultFont,
  bold: defaultFont,
  heading: defaultFont,
};

export const textStyles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.XL,
    fontFamily: FONT_FAMILY.heading,
  },
  subtitle: {
    fontSize: FONT_SIZES.LG,
    fontFamily: FONT_FAMILY.bold,
  },
  label: {
    fontSize: FONT_SIZES.SM,
    fontFamily: FONT_FAMILY.medium,
  },
  body: {
    fontSize: FONT_SIZES.MD,
    fontFamily: FONT_FAMILY.regular,
  },
});
