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

const REACTIONS = ['🔥', '❤️', '😂'];

const EventChatScreen = ({ route }) => {
  const { event } = route.params;
  const { darkMode } = useTheme();

  const [messages, setMessages] = useState([
    { id: '1', user: 'Emily', text: 'Who’s playing tonight?', time: '9:01 PM', reactions: [], pinned: false },
    { id: '2', user: 'You', text: 'I’m in 🔥', time: '9:02 PM', reactions: ['🔥'], pinned: false },
    { id: '3', user: 'Host', text: 'Event starts in 10 minutes!', time: '9:03 PM', reactions: [], pinned: true }
  ]);

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [reactionTarget, setReactionTarget] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    const timer = setTimeout(() => setTyping(true), 5000); // mock typing
    return () => clearTimeout(timer);
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      user: 'You',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      reactions: [],
      pinned: false
    };
    setMessages([...messages, newMsg]);
    setInput('');
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const addReaction = (msgId, emoji) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId
          ? { ...msg, reactions: [...msg.reactions, emoji] }
          : msg
      )
    );
    setReactionTarget(null);
  };

  const pinMessage = (msgId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId
          ? { ...msg, pinned: !msg.pinned }
          : msg
      )
    );
  };

  const renderMessage = ({ item }) => (
    <TouchableOpacity
      onLongPress={() => setReactionTarget(item.id)}
      style={[
        stylesLocal.messageBubble,
        item.user === 'You' ? stylesLocal.userBubble : stylesLocal.otherBubble
      ]}
    >
      <Text style={stylesLocal.sender}>{item.user}</Text>
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
      colors={darkMode ? ['#2c2c2c', '#1b1b1b'] : ['#fff', '#ffe6f0']}
      style={{ flex: 1 }}
    >
      <Header />
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

      {typing && (
        <Text style={{ fontStyle: 'italic', color: '#999', textAlign: 'center', marginBottom: 6 }}>
          Emily is typing...
        </Text>
      )}

      <SafeKeyboardView>
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
