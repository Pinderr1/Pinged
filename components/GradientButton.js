// components/GradientButton.js
import React from 'react';
import { Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

export default function GradientButton({ text, onPress }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 30,
          paddingVertical: 12,
          paddingHorizontal: 24,
          marginVertical: 8,
          alignItems: 'center',
          elevation: 2,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          {text}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
