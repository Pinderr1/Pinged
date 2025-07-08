import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import { useChats } from '../contexts/ChatContext';
import AvatarRing from './AvatarRing';
import GradientButton from './GradientButton';

export default function MatchesPreview({ navigation }) {
  const { theme } = useTheme();
  const { matches } = useChats();
  const styles = getStyles(theme);

  const list = matches.slice(0, 5);
  if (list.length === 0) return null;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.match}
      onPress={() => navigation.navigate('Chat', { user: item })}
    >
      <AvatarRing
        source={item.image}
        overlay={item.avatarOverlay}
        size={56}
        isMatch
        isOnline={item.online}
      />
      <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
        {item.displayName}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Matches</Text>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
      <GradientButton
        text="View All"
        onPress={() => navigation.navigate('Matches')}
        style={{ alignSelf: 'center', width: 160, marginTop: 4 }}
      />
    </View>
  );
}

MatchesPreview.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: { marginBottom: 24, width: '100%' },
    title: {
      fontSize: 16,
      fontWeight: '700',
      alignSelf: 'center',
      marginBottom: 8,
      color: theme.accent,
    },
    list: { paddingHorizontal: 8, marginBottom: 8 },
    match: { alignItems: 'center', marginRight: 12 },
    name: { fontSize: 13, fontWeight: '600', maxWidth: 72, marginTop: 4 },
  });
