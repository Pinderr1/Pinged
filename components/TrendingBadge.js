import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

const TrendingBadge = ({ trending }) => {
  if (!trending) return null;
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: '#ef4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 10 }}>Trending</Text>
    </View>
  );
};

TrendingBadge.propTypes = {
  trending: PropTypes.bool,
};

export default TrendingBadge;
