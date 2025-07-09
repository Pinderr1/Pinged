import { useEffect, useRef } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Animated } from 'react-native';
import PropTypes from 'prop-types';

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

export default function ScreenContainer({
  children,
  style,
  scroll = false,
  contentContainerStyle,
  ...rest
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <AnimatedSafeAreaView style={[styles.container, style, { opacity: fadeAnim }]}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, contentContainerStyle]}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </AnimatedSafeAreaView>
  );
}

ScreenContainer.propTypes = {
  children: PropTypes.node,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  scroll: PropTypes.bool,
  contentContainerStyle: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
  ]),
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  content: {
    flexGrow: 1,
    paddingVertical: 20,
  },
});
