import React from 'react';
import { View, Text, Modal, ScrollView, StyleSheet, Button, Platform } from 'react-native';
import PropTypes from 'prop-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { useDev } from '../contexts/DevContext';
import { useUser } from '../contexts/UserContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { useChats } from '../contexts/ChatContext';

export default function DevPanel({ visible, onClose }) {
  const { logs, clearLogs } = useDev();
  const { user } = useUser();
  const { gamesLeft } = useGameLimit();
  const { matches } = useChats();

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.warn('Failed to clear storage', e);
    }
    if (Updates?.reloadAsync) {
      Updates.reloadAsync();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Dev Info</Text>
        <Text style={styles.label}>Current User</Text>
        <Text style={styles.block}>{JSON.stringify(user, null, 2)}</Text>
        <Text style={styles.label}>Free Games Left</Text>
        <Text style={styles.block}>{String(gamesLeft)}</Text>
        <Text style={styles.label}>Match Count</Text>
        <Text style={styles.block}>{String(matches.length)}</Text>
        <Text style={styles.label}>Error Logs</Text>
        {logs.map((l, idx) => (
          <Text key={idx} style={styles.log}>{l}</Text>
        ))}
        <View style={{ marginTop: 20 }}>
          <Button title="Clear Logs" onPress={clearLogs} />
        </View>
        <View style={{ marginTop: 20 }}>
          <Button title="Clear Storage & Restart" onPress={clearStorage} />
        </View>
        <View style={{ marginTop: 20 }}>
          <Button title="Close" onPress={onClose} />
        </View>
      </ScrollView>
    </Modal>
  );
}

DevPanel.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  block: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  log: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#b91c1c',
    marginBottom: 4,
  },
});
