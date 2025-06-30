import React from 'react';
import { View, TextInput } from 'react-native';

export default function SearchInput({ search, setSearch }) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginBottom: 6,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        elevation: 2,
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
  );
}
