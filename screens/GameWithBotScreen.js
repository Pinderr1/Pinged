import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { bots, getRandomBot } from '../ai/bots';
import { generateReply } from '../ai/chatBot';
import useTicTacToeBotGame from '../hooks/useTicTacToeBotGame';
import { Board as TicTacToeBoard } from '../games/tic-tac-toe';
import SafeKeyboardView from '../components/SafeKeyboardView';
import useRPSBotGame from '../hooks/useRPSBotGame';
import { Board as RPSBoard } from '../games/rock-paper-scissors';

export default function GameWithBotScreen({ route }) {
  const botId = route.params?.botId;
  const initialGame = route.params?.game || 'ticTacToe';
  const [bot, setBot] = useState(
    bots.find((b) => b.id === botId) || getRandomBot()
  );
  const { theme } = useTheme();
  const ttt = useTicTacToeBotGame((res) => handleGameEnd(res, 'ticTacToe'));
  const rps = useRPSBotGame((res) => handleGameEnd(res, 'rps'));

  const [game, setGame] = useState(initialGame);

  const gameMap = {
    ticTacToe: { title: 'Tic Tac Toe', board: TicTacToeBoard, state: ttt },
    rps: { title: 'Rock Paper Scissors', board: RPSBoard, state: rps },
  };

  const { G, ctx, moves, reset } = gameMap[game].state;
  const BoardComponent = gameMap[game].board;
  const title = gameMap[game].title;

  const [gameOver, setGameOver] = useState(false);
  const [messages, setMessages] = useState([
    { id: 'start', sender: bot.name, text: `Hi! I'm ${bot.name}. Let's play!` },
  ]);
  const [text, setText] = useState('');
  const [showBoard, setShowBoard] = useState(true);

  function handleGameEnd(res, gameId) {
    if (gameId !== game || !res) return;
    let msg = 'Draw.';
    if (res.winner === '0') msg = 'You win!';
    else if (res.winner === '1') msg = `${bot.name} wins.`;
    setGameOver(true);
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

  const playAgain = () => {
    reset();
    setGameOver(false);
  };

  const switchBot = () => {
    const newBot = getRandomBot();
    setBot(newBot);
    setMessages((m) => [
      {
        id: Date.now().toString(),
        sender: newBot.name,
        text: `Hi! I'm ${newBot.name}. Let's play!`,
      },
      ...m,
    ]);
    reset();
    setGameOver(false);
  };

  const switchGame = (g) => {
    if (g === game) return;
    setGame(g);
    gameMap[g].state.reset();
    setGameOver(false);
    addSystemMessage(`Switched to ${gameMap[g].title}.`);
  };

  const renderMessage = ({ item }) => {
    if (item.sender === 'system') {
      return (
        <View style={[styles.messageRow, styles.rowCenter]}>
          <View style={[styles.message, styles.system]}>
            <Text style={styles.sender}>System</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        </View>
      );
    }

    const isUser = item.sender === 'you';
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.rowRight : styles.rowLeft,
        ]}
      >
        {!isUser && <Image source={bot.image} style={styles.avatar} />}
        <View
          style={[
            styles.message,
            isUser ? styles.right : styles.left,
          ]}
        >
          <Text style={styles.sender}>{isUser ? 'You' : bot.name}</Text>
          <Text style={styles.text}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
      <LinearGradient colors={[theme.gradientStart, theme.gradientEnd]} style={{ flex: 1 }}>
        <Header />
        <SafeAreaView style={{ flex: 1, paddingTop: 80, paddingHorizontal: 10, paddingBottom: 20 }}>
        <View style={styles.gameTabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              game === 'ticTacToe' ? styles.tabActive : null,
            ]}
            onPress={() => switchGame('ticTacToe')}
          >
            <Text style={styles.tabText}>Tic Tac Toe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, game === 'rps' ? styles.tabActive : null]}
            onPress={() => switchGame('rps')}
          >
            <Text style={styles.tabText}>RPS</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: theme.text }}>
          Playing {title} with {bot.name}
        </Text>
        {showBoard ? (
          <>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowBoard(false)}
            >
              <Text style={styles.closeBtnText}>X</Text>
            </TouchableOpacity>
            <View style={styles.boardWrapper}>
              <BoardComponent
                G={G}
                ctx={ctx}
                moves={moves}
                onGameEnd={(res) => handleGameEnd(res, game)}
              />
            </View>
            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reset</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.showBtn}
            onPress={() => setShowBoard(true)}
          >
            <Text style={styles.showBtnText}>Show Game</Text>
          </TouchableOpacity>
        )}
        {gameOver && (
          <View style={styles.overButtons}>
            <TouchableOpacity style={styles.againBtn} onPress={playAgain}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.newBotBtn} onPress={switchBot}>
              <Text style={{ color: '#000', fontWeight: 'bold' }}>New Bot</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ flex: 1, marginTop: 30, marginBottom: 10 }}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
        <SafeKeyboardView>
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
        </SafeKeyboardView>
        </SafeAreaView>
      </LinearGradient>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
  },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  rowCenter: { justifyContent: 'center' },
  message: {
    padding: 8,
    borderRadius: 10,
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
  overButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  againBtn: {
    backgroundColor: '#28c76f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  newBotBtn: {
    backgroundColor: '#facc15',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  boardWrapper: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#d81b60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  showBtn: {
    backgroundColor: '#607d8b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 10,
  },
  showBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 6,
  },
  gameTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  tabActive: {
    backgroundColor: '#d1c4e9',
  },
  tabText: { fontWeight: 'bold' },
});
