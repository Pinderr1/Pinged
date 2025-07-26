import React from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import PropTypes from 'prop-types';
import { SPACING } from '../layout';

export default function SwipeControls({ buttons, scaleRefs, actionLoading }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.buttonRow}>
      {buttons.map((btn, i) => (
        <Animated.View
          key={btn.icon}
          style={{ transform: [{ scale: scaleRefs[i] }], opacity: actionLoading ? 0.6 : 1 }}
        >
          <TouchableOpacity
            onPressIn={() =>
              Animated.spring(scaleRefs[i], {
                toValue: 0.9,
                useNativeDriver: true,
              }).start()
            }
            onPressOut={() =>
              Animated.spring(scaleRefs[i], {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
              }).start()
            }
            onPress={btn.action}
            onLongPress={btn.longAction}
            delayLongPress={300}
            style={[styles.circleButton, { backgroundColor: btn.color }]}
            disabled={actionLoading}
          >
            {btn.icon === 'game-controller' ? (
              <MaterialCommunityIcons name="gamepad-variant" size={28} color="#fff" />
            ) : (
              <Ionicons name={btn.icon} size={28} color="#fff" />
            )}
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
}

SwipeControls.propTypes = {
  buttons: PropTypes.arrayOf(PropTypes.object).isRequired,
  scaleRefs: PropTypes.arrayOf(PropTypes.object).isRequired,
  actionLoading: PropTypes.bool,
};

const getStyles = (theme) =>
  StyleSheet.create({
    buttonRow: {
      position: 'absolute',
      bottom: SPACING.LG,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      paddingHorizontal: SPACING.XL,
    },
    circleButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
    },
  });
