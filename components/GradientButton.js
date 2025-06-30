// components/GradientButton.js
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import PropTypes from 'prop-types';

export default function GradientButton({
  text,
  onPress,
  width = '100%',
  marginVertical = 8,
  icon,
  style,
  disabled,
}) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width, marginVertical }} disabled={disabled}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
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
            opacity: disabled ? 0.6 : 1,
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

GradientButton.propTypes = {
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marginVertical: PropTypes.number,
  icon: PropTypes.node,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  disabled: PropTypes.bool,
};
