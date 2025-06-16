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
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';

const REACTIONS = ['🔥', '❤️', '😂'];

const EventChatScreen = ({ route }) => {
  const { event } = route.params;
  const { darkMode } = useTheme();
  const { user } = useUser();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [reactionTarget, setReactionTarget] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    const q = query(
      collection(db, 'events', String(event.id), 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const m = d.data();
        return {
          id: d.id,
          user: m.senderName,
          text: m.text,
          time: m.createdAt
            ? new Date(m.createdAt.toDate()).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })
            : '',
          reactions: m.reactions || [],
        };
      });
      setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 0);
    });
    return unsub;
  }, [event.id]);

  const sendMessage = async () => {
    if (!input.trim() || !user?.displayName) return;
    try {
      await addDoc(collection(db, 'events', String(event.id), 'messages'), {
        text: input.trim(),
        senderName: user.displayName,
        createdAt: serverTimestamp(),
        reactions: [],
      });
      setInput('');
    } catch (e) {
      console.warn('Failed to send message', e);
    }
  };

  const addReaction = async (msgId, emoji) => {
    try {
      await updateDoc(
        doc(db, 'events', String(event.id), 'messages', msgId),
        {
          reactions: arrayUnion(emoji),
        }
      );
    } catch (e) {
      console.warn('Failed to react to message', e);
    }
    setReactionTarget(null);
  };

  const renderMessage = ({ item }) => (
    <TouchableOpacity
      onLongPress={() => setReactionTarget(item.id)}
      style={[
        stylesLocal.messageBubble,
        item.user === user?.displayName
          ? stylesLocal.userBubble
          : stylesLocal.otherBubble,
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

    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={darkMode ? ['#444', '#222'] : ['#fff', '#ffe6f0']}
      style={{ flex: 1 }}
    >
      <Header />
      <Text style={stylesLocal.eventTitle}>{event.title}</Text>


      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16 }}
      />


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
    marginTop: 6,
  },
});

export default EventChatScreen;
