import React from 'react';
import { Animated, TouchableOpacity, Dimensions } from 'react-native';
import { SPACING } from '../layout';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';

const CARD_WIDTH = Dimensions.get('window').width * 0.42;

const GameCardBase = ({ children, scale, onPress, onPressIn, onPressOut }) => (
  <Animated.View style={{ transform: [{ scale }] }}>
    <TouchableOpacity
      style={{
        width: CARD_WIDTH,
        marginHorizontal: SPACING.SM,
        marginBottom: SPACING.XL,
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: SPACING.XL,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 2,
        position: 'relative',
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
    >
      {children}
    </TouchableOpacity>
  </Animated.View>
);

GameCardBase.propTypes = {
  children: PropTypes.node.isRequired,
  scale: PropTypes.oneOfType([PropTypes.number, PropTypes.object]),
  onPress: PropTypes.func,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
};

export default GameCardBase;
