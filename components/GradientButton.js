// components/GradientButton.js
import React from 'react';
import { Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GradientButton({ text, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={['#FF75B5', '#FF9A75']}
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
