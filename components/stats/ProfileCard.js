import React from 'react';
import { View, Text } from 'react-native';
import AvatarRing from '../AvatarRing';
import PropTypes from 'prop-types';

const ProfileCard = ({ user, isPremium, styles, accent }) => (
  <View style={styles.profileCard}>
    <AvatarRing
      source={user?.photoURL}
      size={82}
      isPremium={isPremium}
      style={styles.avatar}
    />
    <Text style={styles.name}>{user?.displayName || 'User'}</Text>
    {isPremium && (
      <Text style={[styles.premiumBadge, { backgroundColor: accent }]}>★ Premium</Text>
    )}
  </View>
);

ProfileCard.propTypes = {
  user: PropTypes.object,
  isPremium: PropTypes.bool,
  styles: PropTypes.object.isRequired,
  accent: PropTypes.string.isRequired,
};

export default ProfileCard;
