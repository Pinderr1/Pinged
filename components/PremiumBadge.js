import React from 'react';
import { View, Text } from 'react-native';

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

export default PremiumBadge;
