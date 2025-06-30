import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function CategoryChips({ categories, category, setCategory }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6 }}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat}
          onPress={() => setCategory(cat)}
          style={{
            paddingVertical: 3,
            paddingHorizontal: 8,
            borderRadius: 16,
            backgroundColor: category === cat ? theme.gradientStart : '#eee',
            margin: 2,
          }}
        >
          <Text
            style={{
              color: category === cat ? '#fff' : '#444',
              fontSize: 11,
            }}
          >
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
