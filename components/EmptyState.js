import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import LottieView from 'lottie-react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function EmptyState({ text, animation, image, style }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, style]}>
      {animation ? (
        <LottieView
          source={animation}
          autoPlay
          loop={false}
          style={styles.art}
        />
      ) : image ? (
        <Image source={image} style={styles.art} resizeMode="contain" />
      ) : null}
      <Text style={[styles.text, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

EmptyState.propTypes = {
  text: PropTypes.string.isRequired,
  animation: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
  image: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 40,
  },
  art: {
    width: 180,
    height: 180,
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});
