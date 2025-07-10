import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Easing,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import ScreenContainer from '../components/ScreenContainer';
import { useTheme } from '../contexts/ThemeContext';
import { useDev } from '../contexts/DevContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { HEADER_SPACING } from '../layout';
import { useUser } from '../contexts/UserContext';
import firebase from '../firebase';
import * as Haptics from 'expo-haptics';
import getGlobalStyles from '../styles';
import { games } from '../games';
import SyncedGame from '../components/SyncedGame';
import GameOverModal from '../components/GameOverModal';
import GameContainer from '../components/GameContainer';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import { snapshotExists } from '../utils/firestore';
import { createMatchIfMissing } from '../utils/matches';
import Toast from 'react-native-toast-message';
import { bots, getRandomBot } from "../ai/bots";
import { generateReply } from "../ai/chatBot";
import useBotGame from "../hooks/useBotGame";
import { getBotMove } from "../ai/botMoves";
import SafeKeyboardView from "../components/SafeKeyboardView";
import Loader from "../components/Loader";
import { useSound } from '../contexts/SoundContext';
import EmptyState from '../components/EmptyState';
import useGameSession from '../hooks/useGameSession';
import { logGameStats } from '../utils/gameStats';
import useRequireGameCredits from '../hooks/useRequireGameCredits';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import PlayerInfoBar from '../components/PlayerInfoBar';
import useUserProfile from '../hooks/useUserProfile';
import PropTypes from 'prop-types';
import { computeBadges } from '../utils/badges';
const GameSessionScreen = ({ route, navigation, sessionType }) => {
  const type =
    sessionType || route.params?.sessionType ||
    (route.params?.botId ? 'bot' : 'live');
  if (type === 'bot') {
    return <BotSessionScreen route={route} navigation={navigation} />;
  }
  if (type === 'spectator') {
    return <SpectatorSessionScreen route={route} navigation={navigation} />;
  }
  return <LiveSessionScreen route={route} navigation={navigation} />;
};


const LiveSessionScreen = ({ route, navigation }) => {
  const { darkMode, theme } = useTheme();
  const globalStyles = getGlobalStyles(theme);
  const local = createStyles(theme);
  const { devMode } = useDev();
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const { user, addGameXP } = useUser();
  const isPremiumUser = !!user?.isPremium;
  const requireCredits = useRequireGameCredits();
  const { sendGameInvite, cancelInvite } = useMatchmaking();

  const { game, opponent, status = 'waiting', inviteId } = route.params || {};

  const [inviteStatus, setInviteStatus] = useState(status);
  const [showGame, setShowGame] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [devPlayer, setDevPlayer] = useState('0');
  const [gameResult, setGameResult] = useState(null);
  const gameActive = showGame && !gameResult;

  const GameComponent = game?.id ? games[game.id]?.Client : null;
  const isReady = devMode || inviteStatus === 'ready';
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const [showFallback, setShowFallback] = useState(false);
  const opponentProfile = useUserProfile(opponent?.id);

  const userBadges = computeBadges({
    xp: user?.xp,
    streak: user?.streak,
    badges: user?.badges || [],
    isPremium: user?.isPremium,
  });
  const oppBadges = computeBadges({
    xp: opponentProfile?.xp,
    streak: opponentProfile?.streak,
    badges: opponentProfile?.badges || [],
    isPremium: opponentProfile?.isPremium,
  });

  // Listen for Firestore invite status
  useEffect(() => {
    if (!inviteId || !user?.uid) return;
    const ref = firebase.firestore().collection('gameInvites').doc(inviteId);
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

  useEffect(() => {
    if (countdown !== null) {
      scaleAnim.setValue(1.5);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [countdown]);

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: showGame ? 0 : 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [showGame, overlayOpacity]);

  // Show fallback if waiting too long or invite is cancelled/declined
  useEffect(() => {
    if (devMode || showGame) return;
    if (inviteStatus === 'cancelled' || inviteStatus === 'declined') {
      setShowFallback(true);
      return;
    }
    if (inviteStatus !== 'ready') {
      const t = setTimeout(() => setShowFallback(true), 20000);
      return () => clearTimeout(t);
    }
  }, [inviteStatus, showGame, devMode]);

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return;
    const handleStart = async () => {
      try {
        if (!requireCredits()) return;
        setShowGame(true);
        setCountdown(null);
        recordGamePlayed();
        if (opponent?.id && user?.uid) {
          await createMatchIfMissing(user.uid, opponent.id);
        }
        if (inviteId && user?.uid) {
          const ref = firebase.firestore().collection('gameInvites').doc(inviteId);
          const snap = await ref.get();
          const data = snap.data();
          if (snapshotExists(snap) && (data.from === user.uid || data.to === user.uid)) {
            ref.update({
              status: 'active',
              startedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      } catch (e) {
        console.warn('Failed to start game', e);
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
    if (result) {
      addGameXP();
      if (inviteId) logGameStats(inviteId);
    }
    setGameResult(result);
  };

  const handleRematch = async () => {
    try {
      if (!requireCredits()) return;
      if (inviteId && user?.uid) {
        const ref = firebase.firestore().collection('gameInvites').doc(inviteId);
        const snap = await ref.get();
        const data = snap.data();
        if (snapshotExists(snap) && (data.from === user.uid || data.to === user.uid)) {
          await ref.update({
            status: 'finished',
            endedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
          await firebase
            .firestore()
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
    } catch (e) {
      console.warn('Failed to start rematch', e);
    }
  };

  const [debouncedRematch, rematchWaiting] = useDebouncedCallback(handleRematch, 800);

  const handleCancel = async () => {
    try {
      if (inviteId) await cancelInvite(inviteId);
    } catch (e) {
      console.warn('Failed to cancel invite', e);
    }
    navigation.goBack();
  };

  if (!game || !opponent) {
    return (
      <GradientBackground style={globalStyles.swipeScreen}>
        <Header showLogoOnly />
        <Text style={{ marginTop: 80, color: theme.text }}>
          Invalid game data.
        </Text>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground style={globalStyles.swipeScreen}>
      <Header showLogoOnly />

      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 10 }}>
        <PlayerInfoBar
          name="You"
          xp={user?.xp || 0}
          badges={userBadges}
          isPremium={user?.isPremium}
        />
        <PlayerInfoBar
          name={opponent.displayName}
          xp={opponentProfile?.xp || 0}
          badges={oppBadges}
          isPremium={opponentProfile?.isPremium}
        />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {GameComponent && gameActive && (
          <View style={{ alignItems: 'center' }}>
            {devMode ? (
              <>
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <TouchableOpacity
                    onPress={() => setDevPlayer('0')}
                    style={{
                      backgroundColor: devPlayer === '0' ? theme.accent : '#ccc',
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
                      backgroundColor: devPlayer === '1' ? theme.accent : '#ccc',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: '#fff' }}>Player 2</Text>
                  </TouchableOpacity>
                </View>
                <GameContainer
                  player={{ name: 'You', xp: user?.xp }}
                  opponent={{ name: 'Opponent' }}
                >
                  <GameComponent playerID={devPlayer} matchID="dev" />
                </GameContainer>
              </>
            ) : (
              <SyncedGame
                sessionId={inviteId}
                gameId={game.id}
                opponent={{ id: opponent.id, photo: opponent.photo, online: true }}
                onGameEnd={handleGameEnd}
              />
            )}
          </View>
        )}
        {!showGame && (
          <Animated.View style={[local.overlay, { opacity: overlayOpacity }]}>
            {countdown === null ? (
              showFallback ? (
                <>
                  <Text style={[local.waitText, { color: theme.text }]}>Game didn't start.</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('GameWithBot')}>
                    <Text style={{ color: theme.accent, marginTop: 10 }}>
                      Play with an AI bot instead
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCancel}>
                    <Text style={{ color: theme.accent, marginTop: 10 }}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[local.waitText, { color: theme.text }]}>Waiting for opponent...</Text>
                  <Loader size="small" style={{ marginTop: 20 }} />
                  <TouchableOpacity onPress={() => navigation.navigate('GameWithBot')}>
                    <Text style={{ color: theme.accent, marginTop: 10 }}>
                      Play with an AI bot instead
                    </Text>
                  </TouchableOpacity>
                </>
              )
            ) : (
              <Animated.Text style={[local.countText, { transform: [{ scale: scaleAnim }] }]}>{countdown}</Animated.Text>
            )}
          </Animated.View>
        )}
      </View>

      {/* Game Over Modal */}
      <GameOverModal
        visible={!!gameResult}
        winnerName={
          gameResult?.winner === '0'
            ? 'You'
            : gameResult?.winner === '1'
            ? opponent.displayName
            : null
        }
        winnerAvatar={
          gameResult?.winner === '0'
            ? user.photoURL
            : gameResult?.winner === '1'
            ? opponent.photo
            : null
        }
        winnerId={
          gameResult?.winner === '0'
            ? user.uid
            : gameResult?.winner === '1'
            ? opponent.id
            : null
        }
        onRematch={debouncedRematch}
        rematchDisabled={rematchWaiting}
        onExit={() => navigation.goBack()}
      />
    </GradientBackground>
  );
};


function BotSessionScreen({ route }) {
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

function SpectatorSessionScreen({ route }) {
  const { theme } = useTheme();
  const styles = getSpectatorStyles(theme);
  const anim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef();
  const { sessionId, game, players = [] } = route.params || {};
  const { moveHistory, ctx, loading } = useGameSession(sessionId, game?.id, '');

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [moveHistory]);

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header showLogoOnly />
      <ScreenContainer style={{ paddingTop: HEADER_SPACING }}>
        {loading && (
          <Animated.Text style={[styles.waiting, { opacity: anim }]}>Waiting for Players...</Animated.Text>
        )}
        <View style={styles.playerRow}>
          {players.map((p) => (
            <View key={p.id} style={styles.player}>
              <Image
                source={p.photo ? { uri: p.photo } : require('../assets/logo.png')}
                style={styles.avatar}
              />
              <Text style={styles.playerName}>{p.displayName}</Text>
            </View>
          ))}
        </View>
        <View style={styles.logBox}>
          <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled">
            {moveHistory.map((m, idx) => (
              <Text key={idx} style={styles.logText}>
                Player {Number(m.player) + 1}: {m.action}
              </Text>
            ))}
          </ScrollView>
        </View>
      </ScreenContainer>
    </GradientBackground>
  );
}

const getSpectatorStyles = (theme) =>
  StyleSheet.create({
    waiting: {
      textAlign: 'center',
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 18,
      marginBottom: 12,
    },
    playerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 12,
    },
    player: { alignItems: 'center', marginHorizontal: 8 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginBottom: 4,
      borderWidth: 2,
      borderColor: '#9146FF',
    },
    playerName: { color: theme.text, fontSize: 12 },
    logBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#9146FF',
      borderRadius: 8,
      padding: 8,
      backgroundColor: '#0007',
    },
    logText: { color: '#fff', fontSize: 14, marginBottom: 2 },
  });

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

const createStyles = (theme) =>
  StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0007',
  },
  countText: {
    fontSize: 80,
    color: '#fff',
    fontWeight: 'bold',
  },
  waitText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

GameSessionScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.shape({
      sessionType: PropTypes.string,
      botId: PropTypes.string,
      game: PropTypes.string,
      opponent: PropTypes.object,
      status: PropTypes.string,
      inviteId: PropTypes.string,
      players: PropTypes.array,
    }),
  }).isRequired,
  sessionType: PropTypes.string,
};

export default GameSessionScreen;
