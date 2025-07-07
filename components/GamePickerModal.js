import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';
import { allGames } from '../data/games';

export default function GamePickerModal({ visible, onSelect, onClose }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
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
                onPress={() => onSelect(game)}
              >
                <Text style={styles.optionText}>{game.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  onClose: PropTypes.func.isRequired,
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
    cancelBtn: { marginTop: 16 },
    cancelText: { color: theme.accent },
  });
