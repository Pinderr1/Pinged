import React from 'react';
import { View, Text } from 'react-native';

export default function ProgressBar({ label, value = 0, max = 100, color = '#d81b60' }) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={{ marginVertical: 4 }}>
      {label && (
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>{label}</Text>
      )}
      <View
        style={{
          height: 10,
          width: '100%',
          backgroundColor: '#eee',
          borderRadius: 5,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${pct * 100}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}
