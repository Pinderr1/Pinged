import React from 'react';
import { Animated, TouchableOpacity, Dimensions } from 'react-native';
import { SPACING } from '../layout';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';
import { shadowStyle } from '../styles/common';

const CARD_WIDTH = Dimensions.get('window').width * 0.42;

const GameCardBase = ({ children, scale, onPress, onPressIn, onPressOut, onHoverIn }) => (
  <Animated.View style={{ transform: [{ scale }] }}>
    <TouchableOpacity
      style={[
        {
          width: CARD_WIDTH,
          marginHorizontal: SPACING.SM,
          marginBottom: SPACING.XL,
          backgroundColor: '#fff',
          borderRadius: 16,
          paddingVertical: SPACING.XL,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        shadowStyle,
      ]}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onMouseEnter={onHoverIn}
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
  onHoverIn: PropTypes.func,
};

export default GameCardBase;
