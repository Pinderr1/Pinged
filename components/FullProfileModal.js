import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import PropTypes from 'prop-types';
import { useTheme } from '../contexts/ThemeContext';

export default function FullProfileModal({ visible, onClose, user }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  if (!user) return null;
  const games = Array.isArray(user.favoriteGames)
    ? user.favoriteGames.join(', ')
    : '';
  const fields = [
    { label: 'Age', value: user.age },
    { label: 'Location', value: user.location },
    { label: 'Gender', value: user.gender },
    { label: 'Looking for', value: user.genderPref },
    { label: 'Favorite Games', value: games },
    { label: 'Bio', value: user.bio },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BlurView intensity={60} tint="dark" style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.name}>{user.displayName}</Text>
            {fields.map(
              (f) =>
                f.value ? (
                  <Text key={f.label} style={styles.field}>{`${f.label}: ${f.value}`}</Text>
                ) : null
            )}
            <TouchableOpacity onPress={onClose} style={styles.button}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

FullProfileModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
};

const getStyles = (theme) =>
  StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      width: '85%',
      maxHeight: '80%',
      overflow: 'hidden',
    },
    content: { padding: 20 },
    name: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    field: { color: theme.text, fontSize: 16, marginBottom: 6 },
    button: {
      marginTop: 20,
      alignSelf: 'center',
      backgroundColor: theme.accent,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
    },
    buttonText: { color: '#fff', fontWeight: 'bold' },
  });
