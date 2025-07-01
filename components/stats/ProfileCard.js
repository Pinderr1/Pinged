import React from 'react';
import { View, Text } from 'react-native';
import AvatarRing from '../AvatarRing';
import { Ionicons } from '@expo/vector-icons';
import { getBadgeMeta } from '../../utils/badges';
import PropTypes from 'prop-types';

const ProfileCard = ({ user, isPremium, badges = [], styles, accent }) => (
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
    {badges.length > 0 && (
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        {badges.map((b) => {
          const meta = getBadgeMeta(b);
          if (!meta) return null;
          return (
            <Ionicons
              key={b}
              name={meta.icon}
              size={18}
              color={accent}
              style={{ marginHorizontal: 2 }}
            />
          );
        })}
      </View>
    )}
  </View>
);

ProfileCard.propTypes = {
  user: PropTypes.object,
  isPremium: PropTypes.bool,
  styles: PropTypes.object.isRequired,
  accent: PropTypes.string.isRequired,
  badges: PropTypes.array,
};

export default ProfileCard;
