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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from '../styles';
import TicTacToe from '../games/tic-tac-toe';
import { useChats } from '../contexts/ChatContext';

export default function ChatScreen({ route }) {
  const { user } = route.params;
  const { getMessages, sendMessage } = useChats();
  const isWideScreen = Dimensions.get('window').width > 700;
  const [showGame, setShowGame] = useState(false);
  const [text, setText] = useState('');

  const rawMessages = getMessages(user.id) || [];
  const [messages, setMessages] = useState([]);

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

  const renderMessage = ({ item }) => (
    <View
      style={[
        chatStyles.messageBubble,
        item.sender === 'you'
          ? chatStyles.messageRight
          : chatStyles.messageLeft,
      ]}
    >
      <Text style={chatStyles.sender}>
        {item.sender === 'you' ? 'You' : user.name}
      </Text>
      <Text style={chatStyles.messageText}>{item.text}</Text>
    </View>
  );

  const chatSection = (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={[styles.logoText, { marginBottom: 10 }]}>
        Chat with {user.name}
      </Text>
      <TouchableOpacity
        style={[styles.navBtn, { marginBottom: 10 }]}
        onPress={() => setShowGame((prev) => !prev)}
      >
        <Text style={styles.navBtnText}>
          {showGame ? 'Hide Game' : 'Play Game'}
        </Text>
      </TouchableOpacity>
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

  const gameSection = showGame ? (
    <View
      style={{
        flex: 1,
        padding: 10,
        borderRightWidth: isWideScreen ? 1 : 0,
        borderBottomWidth: isWideScreen ? 0 : 1,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TicTacToe />
    </View>
  ) : null;

  return (
    <LinearGradient colors={['#fff', '#fdeef4']} style={{ flex: 1 }}>
      <Header />
      {isWideScreen ? (
        <View style={{ flex: 1, flexDirection: 'row', paddingTop: 60 }}>
          {gameSection}
          {chatSection}
        </View>
      ) : (
        <ScrollView style={{ flex: 1, paddingTop: 60 }}>
          {gameSection}
          {chatSection}
        </ScrollView>
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
});
