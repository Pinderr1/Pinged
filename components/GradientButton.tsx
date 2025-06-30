// components/GradientButton.tsx
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import {
  BUTTON_ROUND_RADIUS,
  BUTTON_PADDING_SM,
  FONT_SIZE_MD,
} from '../constants/layout';

export interface GradientButtonProps {
  text: string;
  onPress?: () => void;
  width?: number | string;
  marginVertical?: number;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}
export default function GradientButton({
  text,
  onPress,
  width = '100%',
  marginVertical = 8,
  icon,
  style,
  disabled,
}: GradientButtonProps) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width, marginVertical }} disabled={disabled}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          {
            borderRadius: BUTTON_ROUND_RADIUS,
            paddingVertical: BUTTON_PADDING_SM,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 2,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: FONT_SIZE_MD }}>
          {text}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

