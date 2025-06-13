import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GiftedChat } from 'react-native-gifted-chat';
import Header from '../components/Header';
import styles from '../styles';
import { games, gameList } from '../games';
import RNPickerSelect from 'react-native-picker-select';
import { useChats } from '../contexts/ChatContext';
import SafeKeyboardView from '../components/SafeKeyboardView';

export default function ChatScreen({ route, navigation }) {
  const { user, gameId } = route.params;
  const { getMessages, sendMessage } = useChats();
  const GameComponent = gameId ? games[gameId]?.Client : null;

  const isWideScreen = Dimensions.get('window').width > 700;
  const [showGame, setShowGame] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

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
      <TouchableOpacity
        style={[styles.navBtn, { marginTop: 10 }]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.navBtnText}>Challenge to Game</Text>
      </TouchableOpacity>
      {showPicker && (
        <RNPickerSelect
          onValueChange={(value) => {
            if (value) {
              setShowPicker(false);
              const selected = gameList.find((g) => g.id === value);
              if (selected) {
                navigation.navigate('GameLobby', {
                  opponent: user,
                  game: selected,
                  status: 'ready',
                });
              }
            }
          }}
          placeholder={{ label: 'Choose a game...', value: null }}
          items={gameList.map((g) => ({ label: g.title, value: g.id }))}
        />
      )}
    </View>
  );

  const gameSection = showGame && GameComponent ? (
    <View
      style={{
        flex: 1,
        padding: 10,
        borderTopWidth: isWideScreen ? 0 : 1,
        borderLeftWidth: isWideScreen ? 1 : 0,
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
          {chatSection}
          {gameSection}
        </View>
      ) : (
        <ScrollView style={{ flex: 1, paddingTop: 60 }}>
          {chatSection}
          {gameSection}
        </ScrollView>
      )}
    </LinearGradient>
  );
}
