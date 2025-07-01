import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import AvatarRing from '../AvatarRing';

const ProfileCard = ({ user, isPremium, styles, accent }) => (
  <View style={styles.profileCard}>
    <AvatarRing source={user?.photoURL} size={90} isPremium={isPremium} />
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

