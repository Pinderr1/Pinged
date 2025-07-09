import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';

export default function SkeletonPlaceholder({
  shapes = [],
  backgroundColor = '#E1E9EE',
  highlightColor = '#F2F8FC',
  style,
}) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-100%', '100%'],
  });

  return (
    <View style={style}>
      {shapes.map((shape, idx) => {
        const { width, height, borderRadius = 4, circle, size, style: shapeStyle } = shape;
        const base = circle
          ? { width: size, height: size, borderRadius: size / 2 }
          : { width, height, borderRadius };
        return (
          <View key={idx} style={[styles.shape, base, { backgroundColor }, shapeStyle]}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
              <LinearGradient
                colors={[backgroundColor, highlightColor, backgroundColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        );
      })}
      </View>
    );
}

SkeletonPlaceholder.propTypes = {
  shapes: PropTypes.arrayOf(
    PropTypes.shape({
      width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      height: PropTypes.number,
      borderRadius: PropTypes.number,
      circle: PropTypes.bool,
      size: PropTypes.number,
      style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    })
  ),
  backgroundColor: PropTypes.string,
  highlightColor: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  shape: {
    overflow: 'hidden',
    marginVertical: 4,
  },
});
