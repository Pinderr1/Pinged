import React from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import useCardPressAnimation from '../hooks/useCardPressAnimation';
import PropTypes from 'prop-types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Card = ({
  children,
  style,
  onPress,
  icon,
  text,
  gradientColors,
  ...rest
}) => {
  const { theme } = useTheme();
  const { scale, handlePressIn, handlePressOut } = useCardPressAnimation();
  const colors = gradientColors || theme.gradient;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPress ? handlePressIn : undefined}
      onPressOut={onPress ? handlePressOut : undefined}
      disabled={!onPress}
      style={{ transform: [{ scale }], borderRadius: CARD_STYLE.borderRadius }}
      {...rest}
    >
      <LinearGradient colors={colors} style={styles.gradient}>
        <View style={[styles.card, { backgroundColor: theme.card }, style]}>
          {(icon || text) && (
            <View style={styles.headerRow}>
              {icon && <View style={styles.icon}>{icon}</View>}
              {text && (
                <Text style={[styles.headerText, { color: theme.text }]}>
                  {text}
                </Text>
              )}
            </View>
          )}
          {children}
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onPress: PropTypes.func,
  icon: PropTypes.node,
  text: PropTypes.string,
  gradientColors: PropTypes.arrayOf(PropTypes.string),
};

export const CARD_STYLE = {
  borderRadius: 16,
  padding: 16,
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 2,
};

const styles = StyleSheet.create({
  gradient: {
    borderRadius: CARD_STYLE.borderRadius,
    padding: 2,
  },
  card: CARD_STYLE,
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  headerText: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default Card;
