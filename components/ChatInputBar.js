import React, { useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import firebase from '../firebase';
import VoiceRecorderBar from './VoiceRecorderBar';
import { uploadVoiceAsync } from '../utils/upload';
import Toast from 'react-native-toast-message';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import { gameList } from '../games';

export default function ChatInputBar({
  matchId,
  canPlay,
  onPlayPress,
  onShowInvite,
  currentUser,
  theme,
  sendMessage,
  sendGameInvite,
  inviteDisabled,
}) {
  const styles = getStyles(theme);
  const [text, setText] = useState('');
  const [inviting, setInviting] = useState(false);
  const inputRef = useRef(null);
  const typingTimeout = useRef(null);

  const updateTyping = (state) => {
    if (!matchId || !currentUser?.uid) return;
    firebase
      .firestore()
      .collection('matches')
      .doc(matchId)
      .set({ typingIndicator: { [currentUser.uid]: state } }, { merge: true });
  };

  const handleTextChange = (val) => {
    setText(val);
    updateTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => updateTyping(false), 2000);
  };

  const handleSend = async () => {
    if (text.trim()) {
      await sendMessage({ matchId, text: text.trim() });
      setText('');
      updateTyping(false);
    }
  };

  const [debouncedSend, sending] = useDebouncedCallback(handleSend, 800);

  const handleVoiceSend = async (res) => {
    try {
      const url = await uploadVoiceAsync(res.uri, currentUser.uid);
      await sendMessage({ matchId, text: '', meta: { voice: true, url, duration: res.duration } });
    } catch (e) {
      console.warn('Failed to send voice message', e);
      Toast.show({ type: 'error', text1: 'Failed to send voice message' });
    }
  };

  const handleInvite = async () => {
    if (inviting || inviteDisabled || !canPlay) return;
    setInviting(true);
    try {
      const defaultGameId = gameList[0]?.id;
      if (!defaultGameId) return;
      await sendGameInvite(matchId, defaultGameId);
      Toast.show({ type: 'success', text1: 'Invite sent!' });
    } catch (e) {
      console.warn('Failed to send invite', e);
      Toast.show({ type: 'error', text1: 'Failed to send invite' });
    } finally {
      setInviting(false);
    }
  };

  return (
    <View style={styles.bar}>
      <VoiceRecorderBar onFinish={handleVoiceSend} color={theme.text} />
      <TextInput
        ref={inputRef}
        placeholder="Type a message..."
        style={styles.input}
        value={text}
        onChangeText={handleTextChange}
        placeholderTextColor="#888"
      />
      <TouchableOpacity style={[styles.sendBtn, sending && { opacity: 0.6 }]} onPress={debouncedSend} disabled={sending}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.challengeButton,
          (inviting || inviteDisabled || !canPlay) && { opacity: 0.6 },
        ]}
        onPress={handleInvite}
        disabled={inviting || inviteDisabled || !canPlay}
        accessibilityLabel="Challenge"
      >
        <Ionicons name="game-controller" size={18} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.playButton, !canPlay && { opacity: 0.6 }]}
        onPress={onPlayPress}
        disabled={!canPlay}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Play</Text>
      </TouchableOpacity>
      {onShowInvite && (
        <TouchableOpacity style={styles.menuButton} onPress={onShowInvite}>
          <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

ChatInputBar.propTypes = {
  matchId: PropTypes.string.isRequired,
  canPlay: PropTypes.bool,
  onPlayPress: PropTypes.func.isRequired,
  onShowInvite: PropTypes.func,
  currentUser: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  sendMessage: PropTypes.func.isRequired,
  sendGameInvite: PropTypes.func.isRequired,
  inviteDisabled: PropTypes.bool,
};

const getStyles = (theme) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10 },
    input: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
    sendBtn: { backgroundColor: theme.accent, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
    challengeButton: { backgroundColor: theme.accent, padding: 6, borderRadius: 16, alignSelf: 'center', marginLeft: 4 },
    playButton: { backgroundColor: theme.primary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16, alignSelf: 'center', marginLeft: 8 },
    menuButton: { backgroundColor: theme.primary, padding: 6, borderRadius: 16, alignSelf: 'center', marginLeft: 4 },
  });

