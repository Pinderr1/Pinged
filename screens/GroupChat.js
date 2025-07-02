import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import SafeKeyboardView from '../components/SafeKeyboardView';
import Loader from '../components/Loader';
import firebase from '../firebase';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { HEADER_SPACING, FONT_SIZES } from '../layout';
import { useUser } from '../contexts/UserContext';
import Toast from 'react-native-toast-message';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import EmptyState from '../components/EmptyState';

const REACTIONS = ['🔥', '😂', '❤️'];
function GroupChat({ event }) {
  const flatListRef = useRef();
  const { theme } = useTheme();
  const { user } = useUser();
  const groupStyles = getGroupStyles(theme);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [input, setInput] = useState('');
  const [reactionTarget, setReactionTarget] = useState(null);

  useEffect(() => {
    const q = firebase
      .firestore()
      .collection('events')
      .doc(event.id)
      .collection('messages')
      .orderBy('timestamp', 'asc');
    setLoading(true);
    const unsub = q.onSnapshot((snap) => {
      const data = snap.docs.map((d) => {
        const val = d.data();
        return {
          id: d.id,
          user: val.user,
          userId: val.userId,
          reactions: val.reactions || [],
          pinned: !!val.pinned,
          time: val.timestamp?.toDate?.().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          }),
          text: val.text,
        };
      });
      setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, [event.id]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    try {
      await firebase
        .firestore()
        .collection('events')
        .doc(event.id)
        .collection('messages')
        .add({
          user: user?.displayName || 'You',
          userId: user?.uid || null,
          text: input.trim(),
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          reactions: [],
          pinned: false,
        });
      setInput('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Toast.show({ type: 'success', text1: 'Message sent' });
    } catch (e) {
      console.warn('Failed to send message', e);
      Toast.show({ type: 'error', text1: 'Failed to send message' });
    }
  };

  const [debouncedSend, sending] = useDebouncedCallback(sendMessage, 800);

  const addReaction = async (msgId, emoji) => {
    try {
      await firebase
        .firestore()
        .collection('events')
        .doc(event.id)
        .collection('messages')
        .doc(msgId)
        .update({ reactions: firebase.firestore.FieldValue.arrayUnion(emoji) });
    } catch (e) {
      console.warn('Failed to add reaction', e);
    }
    setReactionTarget(null);
  };

  const pinMessage = async (msgId) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;
    try {
      await firebase
        .firestore()
        .collection('events')
        .doc(event.id)
        .collection('messages')
        .doc(msgId)
        .update({ pinned: !msg.pinned });
    } catch (e) {
      console.warn('Failed to pin message', e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const snap = await firebase
        .firestore()
        .collection('events')
        .doc(event.id)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();
      const data = snap.docs.map((d) => {
        const val = d.data();
        return {
          id: d.id,
          user: val.user,
          userId: val.userId,
          reactions: val.reactions || [],
          pinned: !!val.pinned,
          time: val.timestamp?.toDate?.().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          }),
          text: val.text,
        };
      });
      setMessages(data);
    } catch (e) {
      console.warn('Failed to refresh messages', e);
    }
    setRefreshing(false);
  };

  const renderMessage = ({ item }) => (
    <TouchableOpacity
      onLongPress={() => setReactionTarget(item.id)}
      style={[
        groupStyles.messageBubble,
        item.userId === user?.uid ? groupStyles.userBubble : groupStyles.otherBubble,
      ]}
    >
      <View style={groupStyles.senderRow}>
        <Text style={groupStyles.sender}>{item.userId === user?.uid ? 'You' : item.user}</Text>
        {item.pinned && <Text style={groupStyles.pinIcon}>📌</Text>}
      </View>
      <Text style={groupStyles.text}>{item.text}</Text>
      <Text style={groupStyles.time}>{item.time}</Text>

      {item.reactions.length > 0 && (
        <View style={groupStyles.reactionRow}>
          {item.reactions.map((emoji, i) => (
            <Text key={i} style={groupStyles.reactionEmoji}>
              {emoji}
            </Text>
          ))}
        </View>
      )}

      {reactionTarget === item.id && (
        <View style={groupStyles.reactionBar}>
          {REACTIONS.map((emoji, i) => (
            <TouchableOpacity key={i} onPress={() => addReaction(item.id, emoji)}>
              <Text style={groupStyles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {item.user === 'Host' && (
        <TouchableOpacity onPress={() => pinMessage(item.id)}>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            {item.pinned ? '📌 Unpin' : '📍 Pin Message'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      <SafeKeyboardView style={[groupStyles.container, { paddingTop: HEADER_SPACING }]}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Loader />
          </View>
        ) : (
          <>
            <Text style={groupStyles.eventTitle}>{event.title}</Text>

            {messages.filter((m) => m.pinned).map((msg) => (
              <View key={msg.id} style={groupStyles.pinnedBanner}>
                <Text style={groupStyles.pinnedText}>📌 {msg.text}</Text>
              </View>
            ))}

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              ListEmptyComponent={
                <EmptyState
                  text="No messages yet."
                  image={require('../assets/logo.png')}
                />
              }
            />
          </>
        )}

        <View style={groupStyles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            style={groupStyles.input}
          />
          <TouchableOpacity
            onPress={debouncedSend}
            disabled={sending}
            style={[groupStyles.sendBtn, sending && { opacity: 0.6 }]}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeKeyboardView>
    </GradientBackground>
  );
}

const getGroupStyles = (theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  eventTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: HEADER_SPACING,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: theme.accent,
    alignSelf: 'flex-end',
  },
  otherBubble: {
    backgroundColor: '#ccc',
    alignSelf: 'flex-start',
  },
  sender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  text: {
    fontSize: 14,
    color: '#fff',
  },
  time: {
    fontSize: 11,
    color: '#eee',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: theme.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reactionRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  reactionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    marginTop: 6,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  pinIcon: {
    marginLeft: 4,
    fontSize: 12,
    color: '#fff',
  },
  pinnedBanner: {
    backgroundColor: '#fff3cd',
    padding: 10,
    margin: 10,
    borderRadius: 8,
  },
  pinnedText: {
    fontSize: 13,
    color: '#8a6d3b',
  },
});

export default GroupChat;
