import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import ScreenContainer from '../components/ScreenContainer';
import { useTheme } from '../contexts/ThemeContext';
import { bots, getRandomBot } from '../ai/bots';
import { generateReply } from '../ai/chatBot';
import useBotGame from '../hooks/useBotGame';
import { getBotMove } from '../ai/botMoves';
import SafeKeyboardView from '../components/SafeKeyboardView';
import Loader from '../components/Loader';
import { useSound } from '../contexts/SoundContext';
import GameContainer from '../components/GameContainer';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import PlayerInfoBar from '../components/PlayerInfoBar';
import { games } from '../games';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';

function BotGameSession({ route }) {
  const botId = route.params?.botId;
  const initialGame = route.params?.game || 'ticTacToe';
  const [bot, setBot] = useState(
    bots.find((b) => b.id === botId) || getRandomBot()
  );
  const { theme } = useTheme();
  const botStyles = getBotStyles(theme);
  const { user } = useUser();
  const { play } = useSound();
  const [game, setGame] = useState(initialGame);

  const aiKeyMap = { rockPaperScissors: 'rps' };
  const gameMap = Object.keys(games).reduce((acc, key) => {
    const info = games[key];
    const aiKey = aiKeyMap[key] || key;
    acc[aiKey] = {
      title: info.meta?.title || info.name,
      board: info.Board,
      state: useBotGame(
        info.Game,
        (G, player, gameObj) => getBotMove(aiKey, G, player, gameObj),
        (res) => handleGameEnd(res, aiKey)
      ),
    };
    return acc;
  }, {});

  const fallbackKey = 'ticTacToe';
  const activeKey = gameMap[game] ? game : fallbackKey;
  if (!gameMap[game]) console.warn('Unknown game key', game);
  const { G, ctx, moves, reset } = gameMap[activeKey].state;
  const BoardComponent = gameMap[activeKey].board;
  const title = gameMap[activeKey].title;

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    play('message');
  };

  const [debouncedSend, sending] = useDebouncedCallback(handleSend, 800);

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
    if (!gameMap[g]) {
      console.warn('Unknown game key', g);
      return;
    }
    if (g === game) return;
    setGame(g);
    gameMap[g].state.reset();
    setGameOver(false);
    addSystemMessage(`Switched to ${gameMap[g].title}.`);
  };

  const renderMessage = ({ item }) => {
    if (item.sender === 'system') {
      return (
        <View style={[botStyles.messageRow, botStyles.rowCenter]}>
          <View style={[botStyles.message, botStyles.system]}>
            <Text style={botStyles.sender}>System</Text>
            <Text style={botStyles.text}>{item.text}</Text>
          </View>
        </View>
      );
    }

    const isUser = item.sender === 'you';
    return (
      <View
        style={[
          botStyles.messageRow,
          isUser ? botStyles.rowRight : botStyles.rowLeft,
        ]}
      >
        {!isUser && <Image source={bot.image} style={botStyles.avatar} />}
        <View
          style={[
            botStyles.message,
            isUser ? botStyles.right : botStyles.left,
          ]}
        >
          <Text style={botStyles.sender}>{isUser ? 'You' : bot.name}</Text>
          <Text style={botStyles.text}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
      <GradientBackground style={{ flex: 1 }}>
        <Header />
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 10 }}>
          <PlayerInfoBar
            name="You"
            xp={user?.xp || 0}
            badges={computeBadges({
              xp: user?.xp,
              streak: user?.streak,
              badges: user?.badges || [],
              isPremium: user?.isPremium,
            })}
            isPremium={user?.isPremium}
          />
          <PlayerInfoBar name={bot.name} xp={0} badges={[]} />
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
        <ScreenContainer style={{ paddingTop: HEADER_SPACING, paddingBottom: 20 }}>
        <View style={botStyles.gameTabs}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {Object.entries(gameMap).map(([key, val]) => (
              <TouchableOpacity
                key={key}
                style={[botStyles.tab, game === key ? botStyles.tabActive : null]}
                onPress={() => switchGame(key)}
              >
                <Text style={botStyles.tabText}>{val.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: theme.text }}>
          Playing {title} with {bot.name}
        </Text>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {showBoard && !gameOver ? (
              <GameContainer
                onToggleChat={() => setShowBoard(false)}
                player={{ name: 'You', xp: user?.xp }}
                opponent={{ name: bot.name }}
              >
                <View style={botStyles.boardWrapper}>
                  <BoardComponent
                    G={G}
                    ctx={ctx}
                    moves={moves}
                    onGameEnd={(res) => handleGameEnd(res, game)}
                  />
                </View>
                <TouchableOpacity style={botStyles.resetBtn} onPress={reset}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reset</Text>
                </TouchableOpacity>
              </GameContainer>
            ) : !gameOver ? (
              <TouchableOpacity
                style={botStyles.showBtn}
                onPress={() => setShowBoard(true)}
              >
                <Text style={botStyles.showBtnText}>Show Game</Text>
              </TouchableOpacity>
            ) : null}
            {gameOver && (
              <View style={botStyles.overButtons}>
                <TouchableOpacity style={botStyles.againBtn} onPress={playAgain}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Play Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={botStyles.newBotBtn} onPress={switchBot}>
                  <Text style={{ color: '#000', fontWeight: 'bold' }}>New Bot</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={{ flex: 1, marginTop: 10 }}>
            <FlatList
              style={{ flex: 1 }}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              inverted
              contentContainerStyle={{ paddingBottom: 40 }}
              ListEmptyComponent={
                <EmptyState
                  text="No messages yet."
                  image={require('../assets/logo.png')}
                />
              }
            />
            <SafeKeyboardView>
              <View style={botStyles.inputBar}>
                <TextInput
                  style={botStyles.input}
                  placeholder="Type a message..."
                  value={text}
                  onChangeText={setText}
                />
                <TouchableOpacity
                  style={[botStyles.sendBtn, sending && { opacity: 0.6 }]}
                  onPress={debouncedSend}
                  disabled={sending}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
                </TouchableOpacity>
              </View>
            </SafeKeyboardView>
          </View>
        </View>
        </ScreenContainer>
        </KeyboardAvoidingView>
      </GradientBackground>
  );
}

const getBotStyles = (theme) =>
  StyleSheet.create({
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
    backgroundColor: theme.accent,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    backgroundColor: theme.accent,
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

export default BotGameSession;
BotGameSession.propTypes = { route: PropTypes.object.isRequired };
