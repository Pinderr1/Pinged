import { useRef, useEffect } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  Dimensions,
  View,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import PropTypes from 'prop-types';

const screenWidth = Dimensions.get('window').width;
const TOAST_HEIGHT = 60;

const ToastItem = ({ item, index, color, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-TOAST_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const panX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => onDismiss(), 3000);
    return () => clearTimeout(timer);
  }, [translateY, opacity, onDismiss]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        panX.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) > 100) {
          Animated.timing(panX, {
            toValue: gesture.dx > 0 ? screenWidth : -screenWidth,
            duration: 200,
            useNativeDriver: true,
          }).start(onDismiss);
        } else {
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.toast,
        {
          backgroundColor: color,
          top: index * (TOAST_HEIGHT + 8) + 20,
          transform: [{ translateY }, { translateX: panX }],
          opacity,
        },
      ]}
    >
      <Ionicons
        name={item.icon || 'notifications'}
        size={18}
        color="#fff"
        style={{ marginRight: 6 }}
      />
      <Text style={styles.text}>{item.title}</Text>
      {item.actionLabel && item.onPress && (
        <TouchableOpacity onPress={item.onPress} style={styles.actionWrap}>
          <Text style={styles.action}>{item.actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

ToastItem.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

const NotificationCenter = ({ color }) => {
  const { theme } = useTheme();
  const { queue, dismissNotification } = useNotification();
  const bannerColor = color || theme.accent;

  const activeToasts = queue.slice(0, 2);

  if (activeToasts.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={styles.container}>
      {activeToasts.map((item, index) => (
        <ToastItem
          key={item.id}
          item={item}
          index={index}
          color={bannerColor}
          onDismiss={() => dismissNotification(item.id)}
        />
      ))}
    </View>
  );
};

NotificationCenter.propTypes = {
  color: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    width: screenWidth,
    zIndex: 9999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  toast: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  actionWrap: {
    marginLeft: 8,
  },
  action: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default NotificationCenter;
