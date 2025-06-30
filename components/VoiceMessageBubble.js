import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import useVoicePlayback from '../hooks/useVoicePlayback';

export default function VoiceMessageBubble({ message, userName, otherUserId }) {
  const { theme, darkMode } = useTheme();
  const { playing, playPause } = useVoicePlayback(message.url);

  const minutes = Math.floor((message.duration || 0) / 60000);
  const seconds = Math.floor(((message.duration || 0) % 60000) / 1000)
    .toString()
    .padStart(2, '0');

  const bubbleStyle = [
    styles.bubble,
    message.sender === 'you'
      ? styles.right
      : message.sender === 'system'
      ? styles.system
      : styles.left,
  ];

  return (
    <View style={bubbleStyle}>
      <Text style={styles.sender}>
        {message.sender === 'you'
          ? 'You'
          : message.sender === 'system'
          ? 'System'
          : userName}
      </Text>
      <TouchableOpacity style={styles.row} onPress={playPause}>
        <Text style={[styles.icon, { color: theme.text }]}>
          {playing ? '⏸' : '▶️'}
        </Text>
        <Text style={[styles.time, { color: theme.text }]}>{`${minutes}:${seconds}`}</Text>
      </TouchableOpacity>
      {message.sender === 'you' && (
        <Text style={styles.read}>
          {message.readBy.includes(otherUserId) ? '✓✓' : '✓'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
    marginVertical: 5,
  },
  left: {
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
  },
  right: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffb6c1',
  },
  system: {
    alignSelf: 'center',
    backgroundColor: '#ddd',
  },
  sender: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#555',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  time: {
    fontSize: 14,
  },
  read: {
    fontSize: 10,
    color: '#555',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
});
