import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

const PremiumBadge = ({ premium, route, accent }) => {
  if (route) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: premium ? accent : '#aaa',
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
