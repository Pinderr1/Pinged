import React from 'react';
import { View, Text } from 'react-native';
import { textStyles } from '../textStyles';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import GameCardBase from './GameCardBase';
import FavoriteStar from './FavoriteStar';
import PremiumBadge from './PremiumBadge';
import TrendingBadge from './TrendingBadge';
import useCardPressAnimation from '../hooks/useCardPressAnimation';

export default function GameCard({ item, onPress, toggleFavorite, isFavorite, trending }) {
  const { theme } = useTheme();
  const { scale, handlePressIn, handlePressOut } = useCardPressAnimation();

  return (
    <GameCardBase
      scale={scale}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <FavoriteStar isFavorite={isFavorite} onPress={toggleFavorite} />

      <PremiumBadge
        premium={item.premium}
        route={item.route}
        accent={theme.accent}
      />
      <TrendingBadge trending={trending} />

      {item.premium && (
        <Ionicons
          name="lock-closed"
          size={18}
          color={theme.accent}
          style={{ position: 'absolute', bottom: 8, right: 8 }}
        />
      )}

      <View style={{ marginBottom: 10, alignItems: 'center', justifyContent: 'center' }}>
        {item.icon}
      </View>
      <Text style={[textStyles.subtitle, { textAlign: 'center' }]}>
        {item.title}
      </Text>
      <Text style={[textStyles.label, { color: '#666', marginTop: 4 }]}>
        {item.category}
      </Text>
    </GameCardBase>
  );
}

GameCard.propTypes = {
  item: PropTypes.object.isRequired,
  onPress: PropTypes.func.isRequired,
  toggleFavorite: PropTypes.func.isRequired,
  isFavorite: PropTypes.bool.isRequired,
  trending: PropTypes.bool,
};
