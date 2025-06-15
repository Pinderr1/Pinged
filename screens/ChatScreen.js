import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from '../styles';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { useChats } from '../contexts/ChatContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { useUser } from '../contexts/UserContext';
import { useDev } from '../contexts/DevContext';
import { useNavigation } from '@react-navigation/native';
import { games, gameList } from '../games';

export default function ChatScreen({ route }) {
  const { user } = route.params || {};
  const navigation = useNavigation();
  const { user: currentUser } = useUser();
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const { devMode } = useDev();
  const {
    getMessages,
    sendMessage,
    setActiveGame,
    getActiveGame,
    sendGameInvite,
    clearGameInvite,
    acceptGameInvite,
    getPendingInvite,
  } = useChats();
  const { darkMode } = useTheme();
  const { showNotification } = useNotification();
  if (!user) {
    return (
      <LinearGradient colors={[darkMode ? '#444' : '#fff', darkMode ? '#222' : '#ffe6f0']} style={{ flex: 1 }}>
        <Header />
        <Text style={{ marginTop: 80, textAlign: 'center', color: darkMode ? '#fff' : '#000' }}>
          User not found.
        </Text>
      </LinearGradient>
    );
  }
  const prevGameIdRef = useRef(null);
  const isWideScreen = Dimensions.get('window').width > 700;
  const [showGameModal, setShowGameModal] = useState(false);
  const [activeSection, setActiveSection] = useState('chat');
  const [text, setText] = useState('');

  const activeGameId = getActiveGame(user.id);
  const pendingInvite = getPendingInvite(user.id);
  const rawMessages = getMessages(user.id) || [];
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (activeGameId && activeGameId !== prevGameIdRef.current) {
      const title = games[activeGameId].meta.title;
      showNotification(`Game started: ${title}`);
      setActiveSection('game');
    }
    prevGameIdRef.current = activeGameId;
  }, [activeGameId]);

  useEffect(() => {
    const converted = rawMessages.map((msg, index) => ({
      id: msg.id || index.toString(),
      text: msg.text,
      sender: msg.sender,
    }));
    setMessages(converted.reverse());
  }, [rawMessages]);

  const handleSend = () => {
    if (text.trim()) {
      sendMessage(user.id, text.trim());
      setText('');
    }
  };

  const handleGameEnd = (result) => {
    if (!result) return;
    if (result.winner !== undefined) {
      const msg = result.winner === '0' ? 'You win!' : `${user.name} wins.`;
      sendMessage(user.id, `Game over. ${msg}`, 'system');
    } else if (result.draw) {
      sendMessage(user.id, 'Game over. Draw.', 'system');
    }
    setActiveGame(user.id, null);
    setActiveSection('chat');
  };

  const handleGameSelect = (gameId) => {
    const isPremiumUser = !!currentUser?.isPremium;
    if (!isPremiumUser && gamesLeft <= 0 && !devMode) {
      setShowGameModal(false);
      navigation.navigate('PremiumPaywall');
      return;
    }
    const title = games[gameId].meta.title;
    if (activeGameId && activeGameId !== gameId) {
      sendMessage(user.id, `Switched game to ${title}`, 'system');
    } else if (!activeGameId) {
      sendMessage(user.id, `Game started: ${title}`, 'system');
      recordGamePlayed();
    }
    setActiveGame(user.id, gameId);
    setActiveSection('game');
    setShowGameModal(false);
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        chatStyles.messageBubble,
        item.sender === 'you'
          ? chatStyles.messageRight
          : item.sender === 'system'
          ? chatStyles.messageSystem
          : chatStyles.messageLeft,
      ]}
    >
      <Text style={chatStyles.sender}>
        {item.sender === 'you'
          ? 'You'
          : item.sender === 'system'
          ? 'System'
          : user.name}
      </Text>
      <Text style={chatStyles.messageText}>{item.text}</Text>
    </View>
  );

  const renderGameOption = ({ item }) => (
    <TouchableOpacity
      style={chatStyles.gameOption}
      onPress={() => handleGameSelect(item.id)}
    >
      <Text style={chatStyles.gameOptionText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const chatSection = (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={[styles.logoText, { marginBottom: 10 }]}>
        Chat with {user.name}
      </Text>
      <View style={{ flex: 1 }}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingBottom: 20 }}
          inverted
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={60}
        style={chatStyles.inputBar}
      >
        <TouchableOpacity
          style={activeGameId ? chatStyles.changeButton : chatStyles.playButton}
          onPress={() => setShowGameModal(true)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            {activeGameId ? 'Change Game' : 'Play'}
          </Text>
        </TouchableOpacity>
        <TextInput
          placeholder="Type a message..."
          style={chatStyles.textInput}
          value={text}
          onChangeText={setText}
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={chatStyles.sendButton} onPress={handleSend}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );

  const SelectedGameClient = activeGameId ? games[activeGameId].Client : null;
  const gameSection = SelectedGameClient ? (
    <View
      style={{
        flex: 1,
        padding: 10,
        borderRightWidth: isWideScreen ? 1 : 0,
        borderBottomWidth: isWideScreen ? 0 : 1,
        borderColor: darkMode ? '#444' : '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <SelectedGameClient
        matchID={user.id}
        playerID="0"
        onGameEnd={handleGameEnd}
      />
    </View>
  ) : null;

  const gradientColors = darkMode ? ['#444', '#222'] : ['#fff', '#fdeef4'];

  const toggleBar = (
    <View style={chatStyles.toggleBar}>
      <TouchableOpacity
        style={[
          chatStyles.toggleButton,
          activeSection === 'game' && chatStyles.toggleActive,
        ]}
        onPress={() => setActiveSection('game')}
      >
        <Text style={chatStyles.toggleText}>Game View</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          chatStyles.toggleButton,
          activeSection === 'chat' && chatStyles.toggleActive,
        ]}
        onPress={() => setActiveSection('chat')}
      >
        <Text style={chatStyles.toggleText}>Chat View</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <Header />
      <Modal
        visible={showGameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGameModal(false)}
      >
        <View style={chatStyles.modalOverlay}>
          <View style={chatStyles.modalContent}>
            <FlatList
              data={gameList}
              keyExtractor={(item) => item.id}
              renderItem={renderGameOption}
            />
            <TouchableOpacity
              style={[chatStyles.sendButton, { marginTop: 10 }]}
              onPress={() => setShowGameModal(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {isWideScreen ? (
        <View style={{ flex: 1, flexDirection: 'row', paddingTop: 60 }}>
          {gameSection}
          {chatSection}
        </View>
      ) : (
        <View style={{ flex: 1, paddingTop: 60 }}>
          {toggleBar}
          {activeSection === 'game' && <View style={{ flex: 1 }}>{gameSection}</View>}
          {activeSection === 'chat' && <View style={{ flex: 1 }}>{chatSection}</View>}
        </View>
      )}
    </LinearGradient>
  );
}

const chatStyles = StyleSheet.create({
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
    backgroundColor: '#ff4081',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  playButton: {
    backgroundColor: '#009688',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  changeButton: {
    backgroundColor: '#607d8b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  toggleBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    borderRadius: 16,
    backgroundColor: '#ccc',
  },
  toggleActive: {
    backgroundColor: '#009688',
  },
  toggleText: {
    color: '#fff',
    fontWeight: 'bold',
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
});
