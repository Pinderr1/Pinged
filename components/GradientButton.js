// components/GradientButton.js
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GradientButton({
  text,
  onPress,
  width = '100%',
  marginVertical = 8,
  icon,
  style,
}) {
  return (
    <Pressable onPress={onPress} style={{ width, marginVertical }}>
      <LinearGradient
        colors={['#FF75B5', '#FF9A75']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          {
            borderRadius: 30,
            paddingVertical: 12,
            paddingHorizontal: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 2,
          },
          style,
        ]}
      >
        {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          {text}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
