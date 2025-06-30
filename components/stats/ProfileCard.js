import React from 'react';
import { View, Text, Image } from 'react-native';
import PropTypes from 'prop-types';
import { avatarSource } from '../../utils/avatar';

const ProfileCard = ({ user, isPremium, styles, accent }) => (
  <View style={styles.profileCard}>
    <Image source={avatarSource(user?.photoURL)} style={styles.avatar} />
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
