import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FavoriteStar = ({ isFavorite, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}
  >
    <Ionicons
      name={isFavorite ? 'star' : 'star-outline'}
      size={18}
      color={isFavorite ? '#facc15' : '#ccc'}
    />
  </TouchableOpacity>
);

export default FavoriteStar;
