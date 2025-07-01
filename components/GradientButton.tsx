// components/GradientButton.tsx
import React, { useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View, Text, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { BUTTON_STYLE, FONT_SIZES } from '../layout';

export interface GradientButtonProps {
  text: string;
  onPress?: () => void;
  width?: number | string;
  marginVertical?: number;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
}
export default function GradientButton({
  text,
  onPress,
  width = '100%',
  marginVertical = 8,
  icon,
  style,
  disabled,
  onPressIn,
  onPressOut,
}: GradientButtonProps) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
    onPressIn?.();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onPressOut?.();
  };
  return (
    <Animated.View style={{ transform: [{ scale }], width, marginVertical }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
          {
            borderRadius: 30,
            paddingVertical: BUTTON_STYLE.paddingVertical,
            paddingHorizontal: BUTTON_STYLE.paddingHorizontal,
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
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: FONT_SIZES.MD }}>
          {text}
        </Text>
      </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

