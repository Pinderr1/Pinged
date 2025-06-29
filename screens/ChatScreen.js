import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import SafeKeyboardView from '../components/SafeKeyboardView';
import styles from '../styles';
import { games, gameList } from '../games';
import { db, firebase } from '../firebase';
import { uploadVoiceAsync } from '../utils/upload';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { useChats } from '../contexts/ChatContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { useUser } from '../contexts/UserContext';
import { useDev } from '../contexts/DevContext';
import VoiceMessageBubble from '../components/VoiceMessageBubble';
import useVoiceRecorder from '../hooks/useVoiceRecorder';
// TODO: add support for sending short voice or video intro clips in chat
import Toast from 'react-native-toast-message';
import useRequireGameCredits from '../hooks/useRequireGameCredits';

// Available emoji reactions for group chats
const REACTIONS = ['🔥', '😂', '❤️'];

/*******************************
 * Private one-on-one chat UI *
 *******************************/
function PrivateChat({ user }) {
  const navigation = useNavigation();
  const { user: currentUser, addGameXP } = useUser();
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const { devMode } = useDev();
  const requireCredits = useRequireGameCredits();
  const { setActiveGame, getActiveGame, getPendingInvite, startLocalGame } = useChats();
  const { darkMode, theme } = useTheme();
  const privateStyles = getPrivateStyles(theme);
  const { showNotification } = useNotification();

  if (!user) {
    return (
      <GradientBackground style={{ flex: 1 }}>
        <Header />
        <Text style={{ marginTop: 80, textAlign: 'center', color: theme.text }}>
          User not found.
        </Text>
      </GradientBackground>
    );
  }

  const prevGameIdRef = useRef(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [text, setText] = useState('');
  const [devPlayer, setDevPlayer] = useState('0');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);
  const [otherUserId, setOtherUserId] = useState(null);
  const { startRecording, stopRecording, isRecording } = useVoiceRecorder();

  const activeGameId = getActiveGame(user.id);
  const pendingInvite = getPendingInvite(user.id);
  const [messages, setMessages] = useState([]);

  const sendChatMessage = async (msgText = '', sender = 'user', extras = {}) => {
    if (!msgText.trim() && !extras.voice) return;
    if (!user?.id) return;
    try {
      await db
        .collection('matches')
        .doc(user.id)
        .collection('messages')
        .add({
          senderId: sender === 'system' ? 'system' : currentUser?.uid,
          text: msgText.trim(),
          ...extras,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
      if (sender === 'user') {
        Toast.show({ type: 'success', text1: 'Message sent' });
      }
    } catch (e) {
      console.warn('Failed to send message', e);
      if (sender === 'user') {
        Toast.show({ type: 'error', text1: 'Failed to send message' });
      }
    }
  };

  const updateTyping = (state) => {
    if (!user?.id || !currentUser?.uid) return;
    db.collection('matches')
      .doc(user.id)
      .set({ typing: { [currentUser.uid]: state } }, { merge: true });
  };

  const handleTextChange = (val) => {
    setText(val);
    updateTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => updateTyping(false), 2000);
  };

  useEffect(() => {
    if (activeGameId && activeGameId !== prevGameIdRef.current) {
      const title = games[activeGameId].meta.title;
      showNotification(`Game started: ${title}`);
    }
    prevGameIdRef.current = activeGameId;
  }, [activeGameId]);

  useEffect(() => {
    if (!user?.id || !currentUser?.uid) return;
    const ref = db.collection('matches').doc(user.id);
    const unsub = ref.onSnapshot((doc) => {
      const data = doc.data();
      if (data?.users && !otherUserId) {
        const other = data.users.find((u) => u !== currentUser.uid);
        setOtherUserId(other);
      }
      const other = data?.users?.find((u) => u !== currentUser.uid) || otherUserId;
      if (other && data?.typing) {
        setIsTyping(!!data.typing[other]);
      }
    });
    return unsub;
  }, [user?.id, currentUser?.uid, otherUserId]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      updateTyping(false);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !currentUser?.uid) return;
    const msgRef = db
      .collection('matches')
      .doc(user.id)
      .collection('messages')
      .orderBy('timestamp', 'asc');
    const unsub = msgRef.onSnapshot((snap) => {
      const data = snap.docs.map((d) => {
        const val = d.data();
        if (val.senderId !== currentUser.uid && !(val.readBy || []).includes(currentUser.uid)) {
          d.ref.update({
            readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
          });
        }
        return {
          id: d.id,
          text: val.text,
          readBy: val.readBy || [],
          sender: val.senderId === currentUser.uid ? 'you' : val.senderId || 'them',
          voice: !!val.voice,
          url: val.url,
          duration: val.duration,
        };
      });
      setMessages(data.reverse());
    });
    return unsub;
  }, [user?.id, currentUser?.uid]);

  const handleSend = () => {
    if (text.trim()) {
      sendChatMessage(text);
      setText('');
      updateTyping(false);
    }
  };


  const handleVoiceFinish = async () => {
    const result = await stopRecording();
    if (!result) return;
    try {
      const url = await uploadVoiceAsync(result.uri, currentUser.uid);
      await sendChatMessage('', 'user', {
        voice: true,
        url,
        duration: result.duration,
      });
    } catch (e) {
      console.warn('Failed to send voice message', e);
      Toast.show({ type: 'error', text1: 'Failed to send voice message' });
    }
  };

  const handleGameEnd = (result) => {
    if (!result) return;
    addGameXP();
    if (result.winner !== undefined) {
      const msg = result.winner === '0' ? 'You win!' : `${user.name} wins.`;
      sendChatMessage(`Game over. ${msg}`, 'system');
    } else if (result.draw) {
      sendChatMessage('Game over. Draw.', 'system');
    }
    setActiveGame(user.id, null);
  };

  const handleGameSelect = (gameId) => {
    const isPremiumUser = !!currentUser?.isPremium;
    if (!requireCredits()) {
      setShowGameModal(false);
      return;
    }
    const title = games[gameId].meta.title;
    if (activeGameId && activeGameId !== gameId) {
      sendChatMessage(`Switched game to ${title}`, 'system');
    } else if (!activeGameId) {
      sendChatMessage(`Game started: ${title}`, 'system');
      recordGamePlayed();
    }
    setActiveGame(user.id, gameId);
    setShowGameModal(false);
  };

  const renderMessage = ({ item }) => {
    if (item.voice) {
      return (
        <VoiceMessageBubble
          message={item}
          userName={user.name}
          otherUserId={otherUserId}
        />
      );
    }
    return (
      <View
        style={[
          privateStyles.messageBubble,
          item.sender === 'you'
            ? privateStyles.messageRight
            : item.sender === 'system'
            ? privateStyles.messageSystem
            : privateStyles.messageLeft,
        ]}
      >
        <Text style={privateStyles.sender}>
          {item.sender === 'you' ? 'You' : item.sender === 'system' ? 'System' : user.name}
        </Text>
        <Text style={privateStyles.messageText}>{item.text}</Text>
        {item.sender === 'you' && (
          <Text style={privateStyles.readReceipt}>
            {item.readBy.includes(otherUserId) ? '✓✓' : '✓'}
          </Text>
        )}
      </View>
    );
  };

  const renderGameOption = ({ item }) => (
    <TouchableOpacity style={privateStyles.gameOption} onPress={() => handleGameSelect(item.id)}>
      <Text style={privateStyles.gameOptionText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const chatSection = (
    <View style={{ flex: 4, padding: 10 }}>
      <FlatList
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingBottom: 20 }}
        inverted
        keyboardShouldPersistTaps="handled"
      />
      {isTyping && <Text style={privateStyles.typingIndicator}>{user.name} is typing...</Text>}
      <View style={privateStyles.gameBar}>
        <TouchableOpacity
          style={activeGameId ? privateStyles.changeButton : privateStyles.playButton}
          onPress={() => {
            if (!requireCredits()) {
              return;
            }
            setShowGameModal(true);
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            {activeGameId ? 'Change Game' : 'Invite Game'}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={privateStyles.inputBar}>
        <TouchableOpacity
          onLongPress={startRecording}
          onPressOut={handleVoiceFinish}
          style={{ marginRight: 6 }}
        >
          <Ionicons
            name={isRecording ? 'mic' : 'mic-outline'}
            size={22}
            color={theme.text}
          />
        </TouchableOpacity>
        <TextInput
          placeholder="Type a message..."
          style={privateStyles.textInput}
          value={text}
          onChangeText={handleTextChange}
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={privateStyles.sendButton} onPress={handleSend}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const SelectedGameClient = activeGameId ? games[activeGameId].Client : null;
  const gameSection = SelectedGameClient ? (
    <View
      style={{
        flex: 0.6,
        padding: 10,
        borderTopWidth: 1,
        borderColor: darkMode ? '#444' : '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {devMode && (
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => setDevPlayer('0')}
            style={{
              backgroundColor: devPlayer === '0' ? theme.accent : '#ccc',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              marginRight: 8,
            }}
          >
            <Text style={{ color: '#fff' }}>Player 1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setDevPlayer('1')}
            style={{
              backgroundColor: devPlayer === '1' ? theme.accent : '#ccc',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#fff' }}>Player 2</Text>
          </TouchableOpacity>
        </View>
      )}
      <SelectedGameClient matchID={user.id} playerID={devMode ? devPlayer : '0'} onGameEnd={handleGameEnd} />
    </View>
  ) : null;

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      <Modal
        visible={showGameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGameModal(false)}
      >
        <View style={privateStyles.modalOverlay}>
          <View style={privateStyles.modalContent}>
            <FlatList data={gameList} keyExtractor={(item) => item.id} renderItem={renderGameOption} />
            <TouchableOpacity
              style={[privateStyles.sendButton, { marginTop: 10 }]}
              onPress={() => setShowGameModal(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <SafeAreaView style={{ flex: 1 }}>
        <SafeKeyboardView style={{ flex: 1, paddingTop: 60 }}>
          <View style={{ flex: 1 }}>
            {chatSection}
            {gameSection}
          </View>
        </SafeKeyboardView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const getPrivateStyles = (theme) =>
  StyleSheet.create({
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
    marginVertical: 5,
  },
  messageLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
  },
  messageRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffb6c1',
  },
  messageSystem: {
    alignSelf: 'center',
    backgroundColor: '#ddd',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
  },
  sender: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#555',
  },
  readReceipt: {
    fontSize: 10,
    color: '#555',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: theme.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 8,
  },
  playButton: {
    backgroundColor: '#009688',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
  changeButton: {
    backgroundColor: '#607d8b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '60%',
  },
  gameOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  gameOptionText: {
    fontSize: 16,
    color: '#333',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  gameBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
});

/********************
 * Group chat view *
 *******************/
function GroupChat({ event }) {
  const flatListRef = useRef();
  const { theme } = useTheme();
  const { user } = useUser();
  const groupStyles = getGroupStyles(theme);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [reactionTarget, setReactionTarget] = useState(null);

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
      await db
        .collection('events')
        .doc(event.id)
        .collection('messages')
        .doc(msgId)
        .update({ pinned: !msg.pinned });
    } catch (e) {
      console.warn('Failed to pin message', e);
    }
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
      <SafeKeyboardView style={{ flex: 1, paddingTop: 60 }}>
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
          contentContainerStyle={{ padding: 16 }}
        />

        <View style={groupStyles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            style={groupStyles.input}
          />
          <TouchableOpacity onPress={sendMessage} style={groupStyles.sendBtn}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeKeyboardView>
    </GradientBackground>
  );
}

const getGroupStyles = (theme) =>
  StyleSheet.create({
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 80,
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

/**************************
 * Exported chat wrapper  *
 *************************/
export default function ChatScreen({ route }) {
  const { user: paramUser, event } = route.params || {};
  const { matches } = useChats();
  const { theme } = useTheme();

  if (event) return <GroupChat event={event} />;

  const match = matches.find(
    (m) => m.id === paramUser?.id || m.otherUserId === paramUser?.id
  );

  if (!match) {
    return (
      <GradientBackground style={{ flex: 1 }}>
        <Header />
        <Text style={{ marginTop: 80, textAlign: 'center', color: theme.text }}>
          No match found.
        </Text>
      </GradientBackground>
    );
  }

  return <PrivateChat user={match} />;
}
