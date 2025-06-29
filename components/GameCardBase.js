import React from 'react';
import { Animated, TouchableOpacity, Dimensions } from 'react-native';

const CARD_WIDTH = Dimensions.get('window').width * 0.42;

const GameCardBase = ({ children, scale, onPress, onPressIn, onPressOut }) => (
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
        position: 'relative',
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  </Animated.View>
);

export default GameCardBase;
