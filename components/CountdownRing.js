import PropTypes from 'prop-types';
import Svg, { Circle } from 'react-native-svg';

export default function CountdownRing({ size = 48, strokeWidth = 4, progress = 0, color = '#ff8ab3', style }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <Svg width={size} height={size} style={style}>
      <Circle
        stroke={color}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

CountdownRing.propTypes = {
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
  progress: PropTypes.number,
  color: PropTypes.string,
  style: PropTypes.any,
};
