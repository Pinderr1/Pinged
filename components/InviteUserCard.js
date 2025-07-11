import React from 'react';
import { View, Text, Animated } from 'react-native';
import PropTypes from 'prop-types';
import Card from './Card';
import GradientButton from './GradientButton';
import Loader from './Loader';
import useCardPressAnimation from '../hooks/useCardPressAnimation';
import AvatarRing from './AvatarRing';

const InviteUserCard = ({
  item,
  onInvite,
  isInvited,
  isLoading,
  disabled,
  theme,
  darkMode,
  width,
}) => {
  const { scale, handlePressIn, handlePressOut, playSuccess } = useCardPressAnimation();

  const handlePress = () => onInvite(item, playSuccess);

  return (
    <Card
      style={{
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: darkMode ? '#333' : '#eee',
        padding: 12,
        margin: 8,
        width,
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <AvatarRing
          source={item.photo}
          overlay={item.avatarOverlay}
          size={42}
          isMatch
          isOnline={item.online}
          style={{ marginBottom: 8 }}
        />
        <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
          {item.displayName}
        </Text>
        <Text style={{ fontSize: 12, color: item.online ? '#2ecc71' : '#999', marginBottom: 6 }}>
          {item.online ? 'Online' : 'Offline'}
        </Text>
        {isInvited && isLoading ? (
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <Loader size="small" />
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
              Waiting for {item.displayName}...
            </Text>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale }] }}>
            <GradientButton
              text="Invite"
              onPress={handlePress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              width={120}
              disabled={disabled}
              style={{ marginTop: 6 }}
            />
          </Animated.View>
        )}
      </View>
    </Card>
  );
};

InviteUserCard.propTypes = {
  item: PropTypes.object.isRequired,
  onInvite: PropTypes.func.isRequired,
  isInvited: PropTypes.bool,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  theme: PropTypes.object.isRequired,
  darkMode: PropTypes.bool,
  width: PropTypes.number.isRequired,
};

export default InviteUserCard;
