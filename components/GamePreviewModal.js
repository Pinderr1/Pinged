import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import GradientButton from './GradientButton';

export default function GamePreviewModal({
  visible,
  game,
  onPlayFriend,
  onPracticeBot,
  onClose,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const levelMap = {
    quick: 'Beginner',
    medium: 'Intermediate',
    slow: 'Expert',
  };
  const level = game?.level || levelMap[game?.speed] || 'Beginner';
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LottieView
            source={require('../assets/hearts.json')}
            autoPlay
            loop
            style={styles.banner}
          />
          <Text style={styles.title}>{game?.title}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{level}</Text>
          </View>
          <Text style={styles.desc}>{game?.description}</Text>
          <View style={styles.tagsRow}>
            {game?.category && (
              <Text style={styles.tag}>{game.category}</Text>
            )}
            {game?.mode && (
              <Text style={[styles.tag, styles.mode]}>
                {game.mode === 'both' ? 'Co-op or Versus' : game.mode}
              </Text>
            )}
            {game?.speed && (
              <Text style={[styles.tag, styles.speed]}>{game.speed}</Text>
            )}
          </View>
          <GradientButton
            text="Play With Friend"
            onPress={onPlayFriend}
            disabled={!game?.route}
            style={{ borderRadius: 12 }}
          />
          <GradientButton
            text="Practice vs Bot"
            onPress={onPracticeBot}
            style={{ borderRadius: 12 }}
          />
          <TouchableOpacity onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

GamePreviewModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  game: PropTypes.object,
  onPlayFriend: PropTypes.func.isRequired,
  onPracticeBot: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

const getStyles = (theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: '#0009',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      width: '100%',
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 20,
      paddingBottom: 30,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 5,
      alignItems: 'center',
    },
    banner: { width: '100%', height: 80, marginBottom: 10 },
    title: { fontSize: 22, fontWeight: '700', color: theme.text },
    desc: { fontSize: 14, color: theme.textSecondary, marginVertical: 8, textAlign: 'center' },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    tag: {
      backgroundColor: '#eee',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 8,
      marginTop: 4,
      fontSize: 12,
      color: '#333',
    },
    mode: { backgroundColor: '#d1fae5', color: '#065f46' },
    speed: { backgroundColor: '#fef9c3', color: '#92400e' },
    levelBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: theme.accent,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    levelText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    cancel: { textAlign: 'center', color: '#888' },
  });
