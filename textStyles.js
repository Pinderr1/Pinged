import { StyleSheet } from 'react-native';
import { FONT_SIZES } from './layout';

export const textStyles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
  },
  label: {
    fontSize: FONT_SIZES.SM,
  },
  body: {
    fontSize: FONT_SIZES.MD,
  },
});
