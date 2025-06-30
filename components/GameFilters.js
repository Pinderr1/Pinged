import React from 'react';
import { View, TextInput, TouchableOpacity, Text, Keyboard } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function GameFilters({ search, setSearch, filter, setFilter, category, setCategory, categories }) {
  const { theme } = useTheme();
  return (
    <>
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 6,
          backgroundColor: '#fff',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 4,
          elevation: 2
        }}
      >
        <TextInput
          placeholder="Search games..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={{ fontSize: 14, color: '#000', paddingVertical: 3 }}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 6 }}>
        {['All', 'Free', 'Premium', 'Favorites'].map((label) => (
          <TouchableOpacity
            key={label}
            onPress={() => {
              setFilter(label);
              Keyboard.dismiss();
            }}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 16,
              backgroundColor: filter === label ? theme.accent : '#eee',
              marginHorizontal: 3
            }}
          >
            <Text
              style={{
                color: filter === label ? '#fff' : '#444',
                fontWeight: '600',
                fontSize: 12
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
              margin: 2
            }}
          >
            <Text
              style={{
                color: category === cat ? '#fff' : '#444',
                fontSize: 11
              }}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}
