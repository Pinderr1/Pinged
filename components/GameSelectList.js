import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { allGames } from '../constants/games';
import { BADGE_LIST } from '../data/badges';

export default function GameSelectList({ selected = [], onChange, theme, showPreviewBadges = false }) {
  const navigation = useNavigation();
  const { user } = useUser();
  const premiumUntil =
    user?.premiumUntil?.toDate?.() || (user?.premiumUntil ? new Date(user.premiumUntil) : null);
  const isPremiumUser = !!premiumUntil && premiumUntil > new Date();

  const toggle = (name) => {
    if (!onChange) return;
    if (selected.includes(name)) {
      onChange(selected.filter((v) => v !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  const styles = getStyles(theme);

  return (
    <>
      <ScrollView style={styles.container}>
        {allGames.map((g) => {
          const locked = g.premium && !isPremiumUser;
          return (
            <TouchableOpacity
              key={g.slug}
              style={[styles.option, locked && styles.lockedOption]}
              onPress={() => {
                if (locked) {
                  navigation.navigate('PremiumPaywall', { context: 'premium-feature' });
                  return;
                }
                toggle(g.name);
              }}
            >
              {g.icon}
              <View style={styles.info}>
                <Text style={[styles.label, locked && styles.lockedText]}>{g.name}</Text>
                <Text style={[styles.category, locked && styles.lockedText]}>{g.category}</Text>
              </View>
              {locked ? (
                <Ionicons
                  name="lock-closed"
                  size={24}
                  color={theme?.accent}
                  style={styles.checkbox}
                />
              ) : (
                <MaterialCommunityIcons
                  name={
                    selected.includes(g.name)
                      ? 'checkbox-marked'
                      : 'checkbox-blank-outline'
                  }
                  size={24}
                  color={theme?.accent}
                  style={styles.checkbox}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {showPreviewBadges && (
        <View style={styles.badgeRow}>
          {BADGE_LIST.map((b) => (
            <Ionicons
              key={b.id}
              name={b.icon}
              size={20}
              color={theme?.accent}
              style={styles.badgeIcon}
            />
          ))}
        </View>
      )}
    </>
  );
}

GameSelectList.propTypes = {
  selected: PropTypes.array,
  onChange: PropTypes.func,
  theme: PropTypes.object,
  showPreviewBadges: PropTypes.bool,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: { maxHeight: 250 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
    },
    info: { flex: 1, marginLeft: 8 },
    label: { color: theme?.text || '#000', fontSize: 16 },
    category: { color: theme?.textSecondary || '#666', fontSize: 12 },
    checkbox: { marginLeft: 8 },
    lockedOption: { opacity: 0.5 },
    lockedText: { color: theme?.textSecondary || '#666' },
    badgeRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12,
    },
    badgeIcon: { marginHorizontal: 4 },
  });
