import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from './ProgressBar';
import { useTheme } from '../contexts/ThemeContext';
import PropTypes from 'prop-types';
import { BADGE_LIST, getBadgeMeta } from '../utils/badges';


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
        {BADGE_LIST.map((badge) => {
          const earned = badges.includes(badge.id);
          const meta = getBadgeMeta(badge.id) || badge;
          return (
            <TouchableOpacity
              key={badge.id}
              onPress={() => showInfo(meta)}
              style={{ marginHorizontal: 4, opacity: earned ? 1 : 0.3 }}
            >
              <Ionicons
                name={meta.icon}
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
