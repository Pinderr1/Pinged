import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const PremiumBadge = ({ premium, route, accent }) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  if (route) return null;
  const backgroundColor = premium
    ? accent || theme.accent
    : theme.textSecondary;
  return (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('PremiumPaywall', { context: 'premium-feature' })
      }
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor,
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8,
        }}
      >
        <Ionicons
          name={premium ? 'star' : 'lock-closed'}
          size={10}
          color="#fff"
          style={{ marginRight: 2 }}
        />
        <Text style={{ color: '#fff', fontSize: 10 }}>
          {premium ? 'Premium' : 'Coming Soon'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

PremiumBadge.propTypes = {
  premium: PropTypes.bool,
  route: PropTypes.string,
  accent: PropTypes.string,
};

export default PremiumBadge;
