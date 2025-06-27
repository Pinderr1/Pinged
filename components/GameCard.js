import React from 'react';
import { Animated, TouchableOpacity, View, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const CARD_WIDTH = Dimensions.get('window').width * 0.42;

export default function GameCard({ item, scale, onPress, toggleFavorite, isFavorite }) {
  const { theme } = useTheme();

  const categoryColors = {
    Board: ['#FFD3A5', '#FD6585'],
    Quick: ['#A1FFCE', '#FAFFD1'],
    Memory: ['#FCE38A', '#F38181'],
    Word: ['#A18CD1', '#FBC2EB'],
    Card: ['#D4FC79', '#96E6A1'],
    Strategy: ['#FDCB6E', '#E17055'],
    Drawing: ['#84FAB0', '#8FD3F4'],
    Party: ['#FF9A9E', '#FAD0C4'],
    Puzzle: ['#A1C4FD', '#C2E9FB'],
    International: ['#cfd9df', '#e2ebf0']
  };

  const gradientColors = categoryColors[item.category] || [theme.gradientStart, theme.gradientEnd];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPressIn={() =>
          Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true
          }).start()
        }
        onPressOut={() =>
          Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true
          }).start()
        }
        onPress={onPress}
      >
        <LinearGradient
          colors={gradientColors}
          style={{
            width: CARD_WIDTH,
            marginHorizontal: 8,
            marginBottom: 20,
            borderRadius: 16,
            paddingVertical: 20,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 6,
            elevation: 4,
            position: 'relative'
          }}
        >
          <TouchableOpacity
            onPress={toggleFavorite}
            style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={18}
              color={isFavorite ? '#facc15' : '#ccc'}
            />
          </TouchableOpacity>

        {!item.route && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: item.premium ? '#d81b60' : '#aaa',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 8
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10 }}>
              {item.premium ? 'Premium' : 'Coming Soon'}
            </Text>
          </View>
        )}

        {item.premium && (
          <Ionicons
            name="lock-closed"
            size={18}
            color="#d81b60"
            style={{ position: 'absolute', bottom: 8, right: 8 }}
          />
        )}

        <View style={{ marginBottom: 10 }}>{item.icon}</View>
        <Text style={{ fontSize: 15, fontWeight: '600', textAlign: 'center', color: '#fff' }}>
          {item.title}
        </Text>
      </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}
