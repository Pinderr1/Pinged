import LottieView from 'lottie-react-native';
import PropTypes from 'prop-types';

export default function Loader({ size = 'large', style }) {
  const dimension = size === 'small' ? 40 : 80;
  return (
    <LottieView
      source={require('../assets/chess-loader.json')}
      autoPlay
      loop
      style={[{ width: dimension, height: dimension }, style]}
    />
  );
}

Loader.propTypes = {
  size: PropTypes.oneOf(['small', 'large']),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
