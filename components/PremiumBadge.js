import React from 'react';
import { TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const PremiumBadge = ({ premium, route, accent }) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  if (route) return null;
  const backgroundColor = premium ? accent || theme.accent : theme.textSecondary;
  const icon = premium ? 'star' : 'lock-closed';
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('PremiumPaywall', { context: 'paywall' })}
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor,
        padding: 4,
        borderRadius: 8,
      }}
    >
      <Ionicons name={icon} size={12} color="#fff" />
    </TouchableOpacity>
  );
};

PremiumBadge.propTypes = {
  premium: PropTypes.bool,
  route: PropTypes.string,
  accent: PropTypes.string,
};

export default PremiumBadge;
