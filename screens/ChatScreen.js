import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GiftedChat } from 'react-native-gifted-chat';
import Header from '../components/Header';
import styles from '../styles';
import TicTacToe from '../games/tic-tac-toe';
import { useChats } from '../contexts/ChatContext';
import SafeKeyboardView from '../components/SafeKeyboardView';

export default function ChatScreen({ route }) {
  const { user } = route.params;
  const { getMessages, sendMessage } = useChats();
  const GameComponent = TicTacToe;

  const isWideScreen = Dimensions.get('window').width > 700;
  const [showGame, setShowGame] = useState(false);

  const rawMessages = getMessages(user.id);
  const [messages, setMessages] = useState([]);

  // Convert context messages to GiftedChat format
  useEffect(() => {
    const converted = rawMessages.map((msg, index) => ({
      _id: msg.id || index.toString(),
      text: msg.text,
      createdAt: new Date(),
      user: {
        _id: msg.sender === 'you' ? 1 : 2,
        name: msg.sender === 'you' ? 'You' : user.name,
      },
    }));
    setMessages(converted.reverse()); // GiftedChat wants newest first
  }, [rawMessages]);

  const onSend = useCallback((newMessages = []) => {
    for (const m of newMessages) {
      sendMessage(user.id, m.text);
    }
  }, []);

  const chatSection = (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={[styles.logoText, { marginBottom: 10 }]}>
        Chat with {user.name}
      </Text>
      <TouchableOpacity
        style={[styles.navBtn, { marginBottom: 10 }]}
        onPress={() => setShowGame(true)}
      >
        <Text style={styles.navBtnText}>Play Game</Text>
      </TouchableOpacity>
      <SafeKeyboardView style={{ flex: 1 }}>
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{ _id: 1, name: 'You' }}
          renderUsernameOnMessage
          showUserAvatar
          alwaysShowSend
        />
      </SafeKeyboardView>
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
      <GameComponent />
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
