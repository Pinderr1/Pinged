import React from 'react';
import { View } from 'react-native';
import Svg, { Image as SvgImage, Circle, Path } from 'react-native-svg';
import PropTypes from 'prop-types';
import { avatarSource } from '../utils/avatar';

export const OVERLAYS = {
  none: 'None',
  circle: 'Circle Frame',
  star: 'Star Sticker',
};

export default function AvatarCanvas({ source, overlay = 'none', size = 150 }) {
  const imgSrc = avatarSource(source);
  const radius = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <SvgImage
          href={imgSrc}
          width={size}
          height={size}
          preserveAspectRatio="xMidYMid slice"
        />
        {overlay === 'circle' && (
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 2}
            strokeWidth={4}
            stroke="#FFD700"
            fill="transparent"
          />
        )}
        {overlay === 'star' && (
          <Path
            d="M75 5 L90 55 L145 55 L100 85 L115 135 L75 105 L35 135 L50 85 L5 55 L60 55 Z"
            fill="#FFD700"
            stroke="#FFD700"
          />
        )}
      </Svg>
    </View>
  );
}

AvatarCanvas.propTypes = {
  source: PropTypes.any,
  overlay: PropTypes.oneOf(Object.keys(OVERLAYS)),
  size: PropTypes.number,
};
