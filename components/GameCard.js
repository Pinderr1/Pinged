import React from 'react';
import { Animated, TouchableOpacity, View, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CARD_WIDTH = Dimensions.get('window').width * 0.42;

export default function GameCard({ item, scale, onPress, toggleFavorite, isFavorite }) {
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={{
          width: CARD_WIDTH,
          marginHorizontal: 8,
          marginBottom: 20,
          backgroundColor: '#fff',
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

        <View style={{ marginBottom: 10, alignItems: 'center', justifyContent: 'center' }}>{item.icon}</View>
        <Text style={{ fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          {item.category}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
