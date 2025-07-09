import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';

const PremiumBadge = ({ premium, route, accent }) => {
  const { theme } = useTheme();
  if (route) return null;
  const backgroundColor = premium
    ? accent || theme.accent
    : theme.textSecondary;
  return (
    <View
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 10 }}>
        {premium ? 'Premium' : 'Coming Soon'}
      </Text>
    </View>
  );
};

PremiumBadge.propTypes = {
  premium: PropTypes.bool,
  route: PropTypes.string,
  accent: PropTypes.string,
};

export default PremiumBadge;
