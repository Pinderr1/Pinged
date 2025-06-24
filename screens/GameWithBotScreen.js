import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { bots, getRandomBot } from '../ai/bots';
import { generateReply } from '../ai/chatBot';
import useTicTacToeBotGame from '../hooks/useTicTacToeBotGame';
import { Board as TicTacToeBoard } from '../games/tic-tac-toe';

export default function GameWithBotScreen({ route }) {
  const botId = route.params?.botId;
  const bot = bots.find((b) => b.id === botId) || getRandomBot();
  const { theme } = useTheme();
  const { G, ctx, moves, reset } = useTicTacToeBotGame(handleGameEnd);

  const [messages, setMessages] = useState([
    { id: 'start', sender: bot.name, text: `Hi! I'm ${bot.name}. Let's play!` },
  ]);
  const [text, setText] = useState('');

  function handleGameEnd(res) {
    if (!res) return;
    let msg = 'Draw.';
    if (res.winner === '0') msg = 'You win!';
    else if (res.winner === '1') msg = `${bot.name} wins.`;
    addSystemMessage(`Game over. ${msg}`);
  }

  const addSystemMessage = (t) =>
    setMessages((m) => [{ id: Date.now().toString(), sender: 'system', text: t }, ...m]);

  const sendMessage = (t) => {
    setMessages((m) => [
      { id: Date.now().toString(), sender: 'you', text: t },
      ...m,
    ]);
    const reply = generateReply(bot.personality);
    setTimeout(
      () =>
        setMessages((m) => [
          { id: Date.now().toString(), sender: bot.name, text: reply },
          ...m,
        ]),
      600
    );
  };

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(t);
    setText('');
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.message,
        item.sender === 'you'
          ? styles.right
          : item.sender === 'system'
          ? styles.system
          : styles.left,
      ]}
    >
      <Text style={styles.sender}>
        {item.sender === 'you' ? 'You' : item.sender}
      </Text>
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );

  return (
    <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={{ flex: 1 }}>
      <Header />
      <View style={{ flex: 1, paddingTop: 60, paddingHorizontal: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: theme.text }}>
          Playing Tic Tac Toe with {bot.name}
        </Text>
        <View style={{ alignItems: 'center' }}>
          <TicTacToeBoard G={G} ctx={ctx} moves={moves} onGameEnd={handleGameEnd} />
        </View>
        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reset</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginTop: 20 }}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  message: {
    padding: 8,
    borderRadius: 10,
    marginVertical: 4,
    maxWidth: '80%',
  },
  left: {
    alignSelf: 'flex-start',
    backgroundColor: '#f9f9f9',
  },
  right: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffb6c1',
  },
  system: {
    alignSelf: 'center',
    backgroundColor: '#eee',
  },
  sender: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  text: { fontSize: 15 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#d81b60',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  resetBtn: {
    backgroundColor: '#607d8b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 10,
  },
});
