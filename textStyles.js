import { StyleSheet } from 'react-native';
import { FONT_SIZES } from './layout';

export const FONT_FAMILY = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'Inter_700Bold',
  heading: 'Roboto_700Bold',
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
