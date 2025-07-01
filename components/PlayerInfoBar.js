import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from './ProgressBar';
import { useTheme } from '../contexts/ThemeContext';
import PropTypes from 'prop-types';

const BADGES = [
  { id: 'firstWin', icon: 'trophy-outline', title: 'First Win', desc: 'Win your first game.' },
  { id: 'perfectGame', icon: 'star-outline', title: 'Perfect Game', desc: 'Win without mistakes.' },
  { id: 'dailyStreak', icon: 'flame-outline', title: 'Daily Streak', desc: 'Play 7 days in a row.' },
];

export default function PlayerInfoBar({ name, xp = 0, badges = [] }) {
  const { theme } = useTheme();
  const level = Math.floor(xp / 100);
  const progress = xp % 100;

  const showInfo = (badge) => {
    Alert.alert(badge.title, badge.desc);
  };

  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontWeight: '600', color: theme.text }}>{name}</Text>
      <Text style={{ fontSize: 12, color: theme.textSecondary }}>Level {level}</Text>
      <ProgressBar value={progress} max={100} color={theme.accent} />
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        {BADGES.map((badge) => {
          const earned = badges.includes(badge.id);
          return (
            <TouchableOpacity
              key={badge.id}
              onPress={() => showInfo(badge)}
              style={{ marginHorizontal: 4, opacity: earned ? 1 : 0.3 }}
            >
              <Ionicons
                name={badge.icon}
                size={20}
                color={earned ? theme.accent : theme.textSecondary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

PlayerInfoBar.propTypes = {
  name: PropTypes.string.isRequired,
  xp: PropTypes.number,
  badges: PropTypes.array,
};
