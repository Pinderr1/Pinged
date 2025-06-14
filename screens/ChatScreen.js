import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from '../styles';
import { games, gameList } from '../games';
import { useChats } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ChatScreen({ route }) {
  const { user } = route.params;
  const {
    matches,
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
  const isWideScreen = Dimensions.get('window').width > 700;
  const [showGameModal, setShowGameModal] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(getActiveGame(user.id));
  const [activeSection, setActiveSection] = useState('chat');
  const [text, setText] = useState('');
  const [pendingInvite, setPendingInvite] = useState(getPendingInvite(user.id));

  const rawMessages = getMessages(user.id) || [];
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setSelectedGameId(getActiveGame(user.id));
    setPendingInvite(getPendingInvite(user.id));
    if (getActiveGame(user.id)) {
      setActiveSection('game');
    }
  }, [matches]);

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

  const handleAcceptInvite = () => {
    if (pendingInvite) {
      const title = games[pendingInvite.gameId].meta.title;
      acceptGameInvite(user.id);
      sendMessage(user.id, `Game starting: ${title}`, 'system');
      setSelectedGameId(pendingInvite.gameId);
      setPendingInvite(null);
      setActiveSection('game');
    }
  };

  const handleDeclineInvite = () => {
    if (pendingInvite) {
      clearGameInvite(user.id);
      sendMessage(user.id, 'Invite declined', 'system');
      setPendingInvite(null);
    }
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

  const handleGameSelect = (gameId) => {
    const title = games[gameId].meta.title;
    if (selectedGameId) {
      if (selectedGameId !== gameId) {
        setActiveGame(user.id, gameId);
        sendMessage(user.id, `Switched game to ${title}`, 'system');
        setSelectedGameId(gameId);
        setActiveSection('game');
      }
    } else {
      sendGameInvite(user.id, gameId, 'you');
      sendMessage(user.id, `Invited ${user.name} to play ${title}`, 'system');
    }
    setShowGameModal(false);
  };

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
      {pendingInvite && pendingInvite.from === 'them' && (
        <View style={chatStyles.inviteBanner}>
          <Text style={chatStyles.inviteText}>
            {user.name} invited you to play {games[pendingInvite.gameId].meta.title}
          </Text>
          <View style={chatStyles.inviteActions}>
            <TouchableOpacity
              style={[chatStyles.playButton, { marginRight: 8 }]}
              onPress={handleAcceptInvite}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={chatStyles.declineButton}
              onPress={handleDeclineInvite}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
        {selectedGameId ? (
          <TouchableOpacity
            style={chatStyles.changeButton}
            onPress={() => setShowGameModal(true)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Change Game</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={chatStyles.playButton}
            onPress={() => setShowGameModal(true)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Play</Text>
          </TouchableOpacity>
        )}
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

  const SelectedGameClient = selectedGameId ? games[selectedGameId].Client : null;
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
      <SelectedGameClient />
    </View>
  ) : null;

  const gradientColors = darkMode ? ['#121212', '#1e1e1e'] : ['#fff', '#fdeef4'];

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
          {activeSection === 'game' && gameSection}
          {activeSection === 'chat' && chatSection}
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
  inviteBanner: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  inviteText: {
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  inviteActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: '#b00020',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
});
