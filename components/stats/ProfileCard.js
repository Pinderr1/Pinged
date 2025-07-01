import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AvatarRing from '../AvatarRing';
import PropTypes from 'prop-types';
import { BADGE_DEFINITIONS } from '../../data/badges';

const ProfileCard = ({ user, isPremium, styles, accent }) => {
  const badges = user?.badges || [];
  return (
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
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {BADGE_DEFINITIONS.map((badge) => {
          const earned = badges.includes(badge.id);
          return (
            <Ionicons
              key={badge.id}
              name={badge.icon}
              size={20}
              style={{ marginHorizontal: 4, opacity: earned ? 1 : 0.3 }}
              color={earned ? accent : styles.name.color}
            />
          );
        })}
      </View>
    </View>
  );
};

ProfileCard.propTypes = {
  user: PropTypes.object,
  isPremium: PropTypes.bool,
  styles: PropTypes.object.isRequired,
  accent: PropTypes.string.isRequired,
};

export default ProfileCard;
