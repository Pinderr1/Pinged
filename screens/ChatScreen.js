// /screens/ChatScreen.js

import React from 'react';
import { Text, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles';
import Header from '../components/Header';

const ChatScreen = ({ route }) => {
  const { user } = route.params;

  const mockMessages = [
    { id: '1', text: 'Hey! Want to play a game?', sender: 'them' },
    { id: '2', text: 'Sure! What do you like?', sender: 'you' },
    { id: '3', text: 'Tic Tac Toe or Chess?', sender: 'them' }
  ];

  return (
    <LinearGradient colors={['#fff', '#fdeef4']} style={styles.container}>
       <Header />
      <Text style={styles.logoText}>Chat with {user.name}</Text>
      <FlatList
        style={{ width: '100%', marginTop: 20 }}
        data={mockMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text
            style={{
              alignSelf: item.sender === 'you' ? 'flex-end' : 'flex-start',
              color: item.sender === 'you' ? '#d81b60' : '#000',
              fontSize: 16,
              marginBottom: 10,
              backgroundColor: '#f3f3f3',
              padding: 10,
              borderRadius: 8,
              maxWidth: '80%'
            }}
          >
            {item.text}
          </Text>
        )}
      />
      <TouchableOpacity
        style={styles.navBtn}
        onPress={() => alert('Challenge sent!')}
      >
        <Text style={styles.navBtnText}>Challenge to Game</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default ChatScreen;
