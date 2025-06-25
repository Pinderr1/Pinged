import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import SafeKeyboardView from '../components/SafeKeyboardView';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { db, firebase } from '../firebase';
import Toast from 'react-native-toast-message';

const REACTIONS = ['🔥', '❤️', '😂'];

const EventChatScreen = ({ route }) => {
  const { event } = route.params;
  const { darkMode, theme } = useTheme();
  const { user } = useUser();

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState('');
  const [reactionTarget, setReactionTarget] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    const q = db
      .collection('events')
      .doc(event.id)
      .collection('messages')
      .orderBy('timestamp', 'asc');
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
    });
    return unsub;
  }, [event.id]);


  const sendMessage = async () => {
    if (!input.trim()) return;
    try {
      await db
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
      Toast.show({ type: 'success', text1: 'Message sent' });
    } catch (e) {
      console.warn('Failed to send message', e);
      Toast.show({ type: 'error', text1: 'Failed to send message' });
    }
  };

  const addReaction = async (msgId, emoji) => {
    try {
      await db
        .collection('events')
        .doc(event.id)
        .collection('messages')
        .doc(msgId)
        .update({
          reactions: firebase.firestore.FieldValue.arrayUnion(emoji),
        });
    } catch (e) {
      console.warn('Failed to add reaction', e);
    }
    setReactionTarget(null);
  };

  const pinMessage = async (msgId) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;
    try {
      await db
        .collection('events')
        .doc(event.id)
        .collection('messages')
        .doc(msgId)
        .update({
          pinned: !msg.pinned,
        });
    } catch (e) {
      console.warn('Failed to pin message', e);
    }
  };

  const renderMessage = ({ item }) => (
    <TouchableOpacity
      onLongPress={() => setReactionTarget(item.id)}
      style={[
        stylesLocal.messageBubble,
        item.userId === user?.uid ? stylesLocal.userBubble : stylesLocal.otherBubble
      ]}
    >
      <Text style={stylesLocal.sender}>
        {item.userId === user?.uid ? 'You' : item.user}
      </Text>
      <Text style={stylesLocal.text}>{item.text}</Text>
      <Text style={stylesLocal.time}>{item.time}</Text>

      {item.reactions.length > 0 && (
        <View style={stylesLocal.reactionRow}>
          {item.reactions.map((emoji, i) => (
            <Text key={i} style={stylesLocal.reactionEmoji}>{emoji}</Text>
          ))}
        </View>
      )}

      {reactionTarget === item.id && (
        <View style={stylesLocal.reactionBar}>
          {REACTIONS.map((emoji, i) => (
            <TouchableOpacity key={i} onPress={() => addReaction(item.id, emoji)}>
              <Text style={stylesLocal.reactionEmoji}>{emoji}</Text>
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
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={{ flex: 1 }}
    >
      <Header />
      <SafeKeyboardView style={{ flex: 1, paddingTop: 60 }}>
      <Text style={stylesLocal.eventTitle}>{event.title}</Text>

      {messages.filter(m => m.pinned).map((msg) => (
        <View key={msg.id} style={stylesLocal.pinnedBanner}>
          <Text style={stylesLocal.pinnedText}>📌 {msg.text}</Text>
        </View>
      ))}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16 }}
      />

      <View style={stylesLocal.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            style={stylesLocal.input}
          />
          <TouchableOpacity onPress={sendMessage} style={stylesLocal.sendBtn}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeKeyboardView>
    </LinearGradient>
  );
};

const stylesLocal = StyleSheet.create({
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 80,
    paddingBottom: 10
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10
  },
  userBubble: {
    backgroundColor: '#d81b60',
    alignSelf: 'flex-end'
  },
  otherBubble: {
    backgroundColor: '#ccc',
    alignSelf: 'flex-start'
  },
  sender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff'
  },
  text: {
    fontSize: 14,
    color: '#fff'
  },
  time: {
    fontSize: 11,
    color: '#eee',
    marginTop: 4
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f1f1f1',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 10
  },
  sendBtn: {
    backgroundColor: '#d81b60',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  reactionRow: {
    flexDirection: 'row',
    marginTop: 6
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 6
  },
  reactionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    marginTop: 6
  },
  pinnedBanner: {
    backgroundColor: '#fff3cd',
    padding: 10,
    margin: 10,
    borderRadius: 8
  },
  pinnedText: {
    fontSize: 13,
    color: '#8a6d3b'
  }
});

export default EventChatScreen;
