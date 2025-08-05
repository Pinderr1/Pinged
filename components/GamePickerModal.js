import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import { allGames } from '../data/games';

export default function GamePickerModal({
  visible,
  onSelect,
  onPlayStranger,
  onClose,
  inviting,
  inviteDisabled,
  canPlay,
}) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    if (!visible) setSelectedGame(null);
  }, [visible]);

  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Choose a Game</Text>
          <ScrollView style={{ width: '100%' }}>
            {allGames.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={styles.option}
                onPress={() => {
                  setSelectedGame(game);
                  onSelect(game);
                }}
              >
                <Text style={styles.optionText}>{game.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selectedGame && (
            <TouchableOpacity
              onPress={() => onPlayStranger && onPlayStranger(selectedGame.id)}
              style={[
                styles.strangerBtn,
                (inviting || inviteDisabled || !canPlay) && { opacity: 0.6 },
              ]}
              disabled={inviting || inviteDisabled || !canPlay}
            >
              <Text style={styles.strangerText}>Play with Stranger</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

GamePickerModal.propTypes = {
  visible: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onPlayStranger: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  inviting: PropTypes.bool,
  inviteDisabled: PropTypes.bool,
  canPlay: PropTypes.bool,
};

const getStyles = (theme) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxHeight: '80%',
      alignItems: 'center',
    },
    title: { fontWeight: 'bold', fontSize: 16, marginBottom: 12, color: theme.text },
    option: {
      paddingVertical: 10,
      alignItems: 'center',
      borderBottomColor: '#eee',
      borderBottomWidth: 1,
    },
    optionText: { fontSize: 15, color: theme.text },
    strangerBtn: { marginTop: 16 },
    strangerText: { color: theme.accent },
    cancelBtn: { marginTop: 16 },
    cancelText: { color: theme.accent },
  });
