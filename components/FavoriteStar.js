import React from 'react';
import { TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

const FavoriteStar = ({ isFavorite, onPress }) => (
  <TouchableOpacity
    accessible={true}
    accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    onPress={() => {
      Haptics.selectionAsync().catch(() => {});
      onPress();
    }}
    style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}
  >
    <Ionicons
      name={isFavorite ? 'star' : 'star-outline'}
      size={18}
      color={isFavorite ? '#facc15' : '#ccc'}
    />
  </TouchableOpacity>
);

FavoriteStar.propTypes = {
  isFavorite: PropTypes.bool.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default FavoriteStar;
