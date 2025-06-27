import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useDev } from '../contexts/DevContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { useUser } from '../contexts/UserContext';
import { db, firebase } from '../firebase';
import { avatarSource } from '../utils/avatar';
import styles from '../styles';
import { games } from '../games';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SyncedGame from '../components/SyncedGame';
import GameOverModal from '../components/GameOverModal';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import { snapshotExists } from '../utils/firestore';
import Toast from 'react-native-toast-message';
import { bots, getRandomBot } from "../ai/bots";
import { generateReply } from "../ai/chatBot";
import useTicTacToeBotGame from "../hooks/useTicTacToeBotGame";
import { Board as TicTacToeBoard } from "../games/tic-tac-toe";
import SafeKeyboardView from "../components/SafeKeyboardView";
import useRPSBotGame from "../hooks/useRPSBotGame";
import { Board as RPSBoard } from "../games/rock-paper-scissors";
const GameSessionScreen = ({ route, navigation, sessionType }) => {
  const type = sessionType || route.params?.sessionType || (route.params?.botId ? "bot" : "live");
  return type === "bot" ? (
    <BotSessionScreen route={route} navigation={navigation} />
  ) : (
    <LiveSessionScreen route={route} navigation={navigation} />
  );
};


const LiveSessionScreen = ({ route, navigation }) => {
  const { darkMode, theme } = useTheme();
  const { devMode } = useDev();
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const { user, addGameXP } = useUser();
  const isPremiumUser = !!user?.isPremium;
  const { sendGameInvite } = useMatchmaking();

  const { game, opponent, status = 'waiting', inviteId } = route.params || {};

  const [inviteStatus, setInviteStatus] = useState(status);
  const [showGame, setShowGame] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [devPlayer, setDevPlayer] = useState('0');
  const [gameResult, setGameResult] = useState(null);

  const GameComponent = game?.id ? games[game.id]?.Client : null;
  const isReady = devMode || inviteStatus === 'ready';

  // Listen for Firestore invite status
  useEffect(() => {
    if (!inviteId || !user?.uid) return;
    const ref = db.collection('gameInvites').doc(inviteId);
    const unsub = ref.onSnapshot((snap) => {
      if (snapshotExists(snap)) {
        const data = snap.data();
        if (data.from === user.uid || data.to === user.uid) {
          setInviteStatus(data.status);
        }
      }
    });
    return unsub;
  }, [inviteId, user?.uid]);

  // Trigger countdown if ready
  useEffect(() => {
    if (isReady && !showGame && countdown === null && !devMode) {
      setCountdown(3);
    }
  }, [isReady]);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    const handleStart = async () => {
      if (!isPremiumUser && gamesLeft <= 0 && !devMode) {
        navigation.navigate('PremiumPaywall');
        return;
      }
      setShowGame(true);
      recordGamePlayed();
      if (inviteId && user?.uid) {
        const ref = db.collection('gameInvites').doc(inviteId);
        const snap = await ref.get();
        const data = snap.data();
        if (snapshotExists(snap) && (data.from === user.uid || data.to === user.uid)) {
          ref.update({
            status: 'active',
            startedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    };

    if (countdown <= 0) {
      handleStart();
    } else {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown, inviteId, user?.uid]);

  const handleGameEnd = (result) => {
    if (result) addGameXP();
    setGameResult(result);
  };

  const handleRematch = async () => {
    if (!isPremiumUser && gamesLeft <= 0 && !devMode) {
      navigation.navigate('PremiumPaywall');
      return;
    }
    if (inviteId && user?.uid) {
      const ref = db.collection('gameInvites').doc(inviteId);
        const snap = await ref.get();
        const data = snap.data();
        if (snapshotExists(snap) && (data.from === user.uid || data.to === user.uid)) {
          await ref.update({
            status: 'finished',
            endedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
          await db
          .collection('gameSessions')
          .doc(inviteId)
          .update({
            archived: true,
            archivedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
      }
    }

    const newId = await sendGameInvite(opponent.id, game.id);
    Toast.show({ type: 'success', text1: 'Invite sent!' });
    setGameResult(null);
    navigation.replace('GameSession', {
      game,
      opponent,
      inviteId: newId,
      status: devMode ? 'ready' : 'waiting',
    });
  };

  if (!game || !opponent) {
    return (
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.swipeScreen}
      >
        <Header showLogoOnly />
        <Text style={{ marginTop: 80, color: theme.text }}>
          Invalid game data.
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={styles.swipeScreen}
    >
      <Header showLogoOnly />

      {/* Game Info */}
      <View style={{ alignItems: 'center', marginTop: 70, marginBottom: 20 }}>
        <MaterialCommunityIcons name="controller-classic" size={34} color={theme.text} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>
          {game.title}
        </Text>
      </View>

      {/* Players Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 30 }}>
        {/* You */}
        <View style={{ alignItems: 'center' }}>
          <Image
            source={avatarSource(user?.photoURL)}
            style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 6 }}
          />
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
            You
          </Text>
        </View>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#d81b60' }}>VS</Text>

        {/* Opponent */}
        <View style={{ alignItems: 'center' }}>
          <Image
            source={avatarSource(opponent?.photo)}
            style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 6 }}
          />
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
            {opponent?.name || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Status Message */}
      <Text style={{ textAlign: 'center', color: theme.textSecondary, marginBottom: 30 }}>
        {countdown !== null
          ? `Starting in ${countdown}...`
          : isReady
          ? 'Both players are ready!'
          : 'Waiting for opponent to accept...'}
      </Text>
      {!isReady && countdown === null && (
        <Loader size="small" style={{ marginBottom: 20 }} />
      )}

      {/* Buttons */}
      <View style={{ paddingHorizontal: 20 }}>
        <TouchableOpacity
          style={{
            backgroundColor: isReady ? '#28c76f' : '#ccc',
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: 'center',
            marginBottom: 12
          }}
          disabled={!isReady || countdown !== null}
          onPress={() => {
            if (!isPremiumUser && gamesLeft <= 0 && !devMode) {
              navigation.navigate('PremiumPaywall');
              return;
            }
            setShowGame(true);
            recordGamePlayed();
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Play Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#facc15',
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            marginBottom: 12
          }}
          onPress={() =>
            navigation.navigate('Chat', {
              user: {
                id: opponent?.id,
                name: opponent?.name,
                image: opponent?.photo,
              },
              gameId: game.id,
            })
          }
        >
          <Text style={{ color: '#000', fontWeight: '600' }}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#d81b60',
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center'
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Game Component */}
      {showGame && GameComponent && (
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          {devMode ? (
            <>
              <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={() => setDevPlayer('0')}
                  style={{
                    backgroundColor: devPlayer === '0' ? '#d81b60' : '#ccc',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: '#fff' }}>Player 1</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDevPlayer('1')}
                  style={{
                    backgroundColor: devPlayer === '1' ? '#d81b60' : '#ccc',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: '#fff' }}>Player 2</Text>
                </TouchableOpacity>
              </View>
              <GameComponent playerID={devPlayer} matchID="dev" />
            </>
          ) : (
            <SyncedGame
              sessionId={inviteId}
              gameId={game.id}
              opponentId={opponent.id}
              onGameEnd={handleGameEnd}
            />
          )}
        </View>
      )}

      {/* Game Over Modal */}
      <GameOverModal
        visible={!!gameResult}
        winnerName={
          gameResult?.winner === '0'
            ? 'You'
            : gameResult?.winner === '1'
            ? opponent.name
            : null
        }
        onRematch={handleRematch}
        onChat={() =>
          navigation.navigate('Chat', {
            user: { id: opponent.id, name: opponent.name, image: opponent.photo },
            gameId: game.id,
          })
        }
      />
    </LinearGradient>
  );
};


 function BotSessionScreen({ route }) {
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
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
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
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
          </View>
          <View style={{ flex: 1, marginTop: 10 }}>
            <FlatList
              style={{ flex: 1 }}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              inverted
              contentContainerStyle={{ paddingBottom: 40 }}
            />
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
          </View>
        </View>
        </SafeAreaView>
        </KeyboardAvoidingView>
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
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

export default GameSessionScreen;
