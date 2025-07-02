import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  RefreshControl,
  Platform,
  Keyboard,
  LayoutAnimation,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PropTypes from 'prop-types';
import { avatarSource } from '../utils/avatar';
import AvatarRing from '../components/AvatarRing';
import Header from '../components/Header';
import SafeKeyboardView from '../components/SafeKeyboardView';
import Loader from '../components/Loader';
import ScreenContainer from '../components/ScreenContainer';
import GameContainer from '../components/GameContainer';
import GameMenu from '../components/GameMenu';
import ChatContainer from '../components/ChatContainer';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';
import { games, gameList } from '../games';
import { icebreakers } from '../data/prompts';
import firebase from '../firebase';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { uploadVoiceAsync } from '../utils/upload';
import { useTheme } from '../contexts/ThemeContext';
import { HEADER_SPACING, FONT_SIZES } from '../layout';
import { useNotification } from '../contexts/NotificationContext';
import { useChats } from '../contexts/ChatContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { useUser } from '../contexts/UserContext';
import { useDev } from '../contexts/DevContext';
import VoiceMessageBubble from '../components/VoiceMessageBubble';
import useVoiceRecorder from '../hooks/useVoiceRecorder';
// TODO: add support for sending short voice or video intro clips in chat
import Toast from 'react-native-toast-message';
import useRequireGameCredits from '../hooks/useRequireGameCredits';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import EmptyState from '../components/EmptyState';

// Available emoji reactions for group chats
const REACTIONS = ['🔥', '😂', '❤️'];
const INPUT_BAR_HEIGHT = 70;

/*******************************
 * Private one-on-one chat UI *
 *******************************/
function PrivateChat({ user }) {
  const navigation = useNavigation();
  const { user: currentUser, addGameXP } = useUser();
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const { devMode } = useDev();
  const requireCredits = useRequireGameCredits();
  const { setActiveGame, getActiveGame, getPendingInvite, startLocalGame } = useChats();
  const { darkMode, theme } = useTheme();
  const privateStyles = getPrivateStyles(theme);
  const BOARD_HEIGHT = Dimensions.get('window').height / 2;
  const { showNotification } = useNotification();
  const insets = useSafeAreaInsets();

  if (!user) {
    return (
      <GradientBackground style={{ flex: 1 }}>
        <Header />
        <Text style={{ marginTop: 80, textAlign: 'center', color: theme.text }}>
          User not found.
        </Text>
      </GradientBackground>
    );
  }

  const prevGameIdRef = useRef(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [text, setText] = useState('');
  const [devPlayer, setDevPlayer] = useState('0');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef(null);
  const typingTimeout = useRef(null);
  const [otherUserId, setOtherUserId] = useState(null);
  const { startRecording, stopRecording, isRecording } = useVoiceRecorder();
  const [showGame, setShowGame] = useState(true);

  const activeGameId = getActiveGame(user.id);
  const pendingInvite = getPendingInvite(user.id);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firstLine, setFirstLine] = useState('');
  const [firstGame, setFirstGame] = useState(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [gameResult, setGameResult] = useState(null);
  const winSound = useRef(null);
  const loseSound = useRef(null);
  const drawSound = useRef(null);
  const showPlaceholders = loading && messages.length === 0;

  useEffect(() => {
    setFirstLine(
      icebreakers[Math.floor(Math.random() * icebreakers.length)] || ''
    );
    setFirstGame(
      gameList[Math.floor(Math.random() * gameList.length)] || null
    );
  }, []);

  useEffect(() => {
    const loadSounds = async () => {
      try {
        const win = await Audio.Sound.createAsync({ uri: './assets/sfx/win.mp3' });
        winSound.current = win.sound || win;
        const lose = await Audio.Sound.createAsync({ uri: './assets/sfx/lose.mp3' });
        loseSound.current = lose.sound || lose;
        const draw = await Audio.Sound.createAsync({ uri: './assets/sfx/draw.mp3' });
        drawSound.current = draw.sound || draw;
      } catch (e) {
        console.warn('Failed to load game end sounds', e);
      }
    };
    loadSounds();
    return () => {
      winSound.current?.unloadAsync();
      loseSound.current?.unloadAsync();
      drawSound.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    const handleShow = (e) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardOpen(true);
      setKeyboardHeight(e.endCoordinates?.height || 0);
    };

    const handleHide = () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardOpen(false);
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener('keyboardDidShow', handleShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', handleHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Initial prompt and game suggestion

  const sendChatMessage = async (msgText = '', sender = 'user', extras = {}) => {
    if (!msgText.trim() && !extras.voice) return;
    if (!user?.id) return;
    try {
      await firebase
        .firestore()
        .collection('matches')
        .doc(user.id)
        .collection('messages')
        .add({
          senderId: sender === 'system' ? 'system' : currentUser?.uid,
          text: msgText.trim(),
          ...extras,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
      if (sender === 'user') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        Toast.show({ type: 'success', text1: 'Message sent' });
      }
    } catch (e) {
      console.warn('Failed to send message', e);
      if (sender === 'user') {
        Toast.show({ type: 'error', text1: 'Failed to send message' });
      }
    }
  };

  const updateTyping = (state) => {
    if (!user?.id || !currentUser?.uid) return;
    firebase
      .firestore()
      .collection('matches')
      .doc(user.id)
      .set({ typing: { [currentUser.uid]: state } }, { merge: true });
  };

  const handleTextChange = (val) => {
    setText(val);
    updateTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => updateTyping(false), 2000);
  };

  useEffect(() => {
    if (activeGameId && activeGameId !== prevGameIdRef.current) {
      const title = games[activeGameId].meta.title;
      showNotification(`Game started: ${title}`);
    }
    prevGameIdRef.current = activeGameId;
  }, [activeGameId]);

  useEffect(() => {
    if (!user?.id || !currentUser?.uid) return;
    const ref = firebase.firestore().collection('matches').doc(user.id);
    const unsub = ref.onSnapshot((doc) => {
      const data = doc.data();
      if (data?.users && !otherUserId) {
        const other = data.users.find((u) => u !== currentUser.uid);
        setOtherUserId(other);
      }
      const other = data?.users?.find((u) => u !== currentUser.uid) || otherUserId;
      if (other && data?.typing) {
        setIsTyping(!!data.typing[other]);
      }
    });
    return unsub;
  }, [user?.id, currentUser?.uid, otherUserId]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      updateTyping(false);
    };
  }, []);

  useEffect(() => {
    if (!user?.id || !currentUser?.uid) return;
    setLoading(true);
    const msgRef = firebase
      .firestore()
      .collection('matches')
      .doc(user.id)
      .collection('messages')
      .orderBy('timestamp', 'asc');
    const unsub = msgRef.onSnapshot((snap) => {
      const data = snap.docs.map((d) => {
        const val = d.data();
        if (val.senderId !== currentUser.uid && !(val.readBy || []).includes(currentUser.uid)) {
          d.ref.update({
            readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
          });
        }
        return {
          id: d.id,
          text: val.text,
          readBy: val.readBy || [],
          sender: val.senderId === currentUser.uid ? 'you' : val.senderId || 'them',
          voice: !!val.voice,
          url: val.url,
          duration: val.duration,
        };
      });
      setMessages(data.reverse());
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, [user?.id, currentUser?.uid]);

  const handleSend = () => {
    if (text.trim()) {
      sendChatMessage(text);
      setText('');
      updateTyping(false);
    }
  };

  const [debouncedSend, sending] = useDebouncedCallback(handleSend, 800);


  const handleVoiceFinish = async () => {
    const result = await stopRecording();
    if (!result) return;
    try {
      const url = await uploadVoiceAsync(result.uri, currentUser.uid);
      await sendChatMessage('', 'user', {
        voice: true,
        url,
        duration: result.duration,
      });
    } catch (e) {
      console.warn('Failed to send voice message', e);
      Toast.show({ type: 'error', text1: 'Failed to send voice message' });
    }
  };

  const handleRefresh = async () => {
    if (!user?.id || !currentUser?.uid) return;
    setRefreshing(true);
    try {
      const snap = await firebase
        .firestore()
        .collection('matches')
        .doc(user.id)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();
      const data = snap.docs.map((d) => {
        const val = d.data();
        return {
          id: d.id,
          text: val.text,
          readBy: val.readBy || [],
          sender: val.senderId === currentUser.uid ? 'you' : val.senderId || 'them',
          voice: !!val.voice,
          url: val.url,
          duration: val.duration,
        };
      });
      setMessages(data.reverse());
    } catch (e) {
      console.warn('Failed to refresh messages', e);
    }
    setRefreshing(false);
  };

  const playSound = async (type) => {
    try {
      if (type === 'win') {
        await winSound.current?.replayAsync();
      } else if (type === 'lose') {
        await loseSound.current?.replayAsync();
      } else if (type === 'draw') {
        await drawSound.current?.replayAsync();
      }
    } catch (e) {
      console.warn('Failed to play sound', e);
    }
  };

  const handleGameEnd = (result) => {
    if (!result) return;
    addGameXP();
    setGameResult(result);
    if (result.winner !== undefined) {
      const msg = result.winner === '0' ? 'You win!' : `${user.displayName} wins.`;
      sendChatMessage(`Game over. ${msg}`, 'system');
      if (result.winner === '0') {
        playSound('win');
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {});
      } else if (result.winner === '1') {
        playSound('lose');
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        ).catch(() => {});
      }
    } else if (result.draw) {
      sendChatMessage('Game over. Draw.', 'system');
      playSound('draw');
      Haptics.selectionAsync().catch(() => {});
    }
    setTimeout(() => {
      setActiveGame(user.id, null);
    }, 2000);
  };

  useEffect(() => {
    if (gameResult) {
      const t = setTimeout(() => setGameResult(null), 2000);
      return () => clearTimeout(t);
    }
  }, [gameResult]);


  const handleGameSelect = (gameId) => {
    const isPremiumUser = !!currentUser?.isPremium;
    if (!requireCredits()) {
      setShowGameModal(false);
      return;
    }
    const title = games[gameId].meta.title;
    if (activeGameId && activeGameId !== gameId) {
      sendChatMessage(`Switched game to ${title}`, 'system');
    } else if (!activeGameId) {
      sendChatMessage(`Game started: ${title}`, 'system');
      recordGamePlayed();
    }
    setActiveGame(user.id, gameId);
    setShowGameModal(false);
  };

  const renderMessage = ({ item }) => {
    if (item.voice) {
      return (
        <VoiceMessageBubble
          message={item}
          userName={user.displayName}
          otherUserId={otherUserId}
        />
      );
    }

    if (item.sender === 'system') {
      return (
        <View style={[privateStyles.messageRow, privateStyles.rowCenter]}>
          <View style={[privateStyles.message, privateStyles.system]}>
            <Text style={privateStyles.sender}>System</Text>
            <Text style={privateStyles.text}>{item.text}</Text>
          </View>
        </View>
      );
    }

    const isUser = item.sender === 'you';
    return (
      <View
        style={[privateStyles.messageRow, isUser ? privateStyles.rowRight : privateStyles.rowLeft]}
      >
        {!isUser && user.image && (
          <AvatarRing
            source={user.image}
            size={32}
            isMatch
            isOnline={user.online}
            style={privateStyles.avatar}
          />
        )}
        <View
          style={[privateStyles.message, isUser ? privateStyles.right : privateStyles.left]}
        >
          <Text style={privateStyles.sender}>{isUser ? 'You' : user.displayName}</Text>
          <Text style={privateStyles.text}>{item.text}</Text>
          {isUser && (
            <Text style={privateStyles.readReceipt}>
              {item.readBy.includes(otherUserId) ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderGameOption = ({ item }) => (
    <TouchableOpacity style={privateStyles.gameOption} onPress={() => handleGameSelect(item.id)}>
      <Text style={privateStyles.gameOptionText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const PlaceholderBubbles = () => {
    const widths = ['60%', '70%', '55%', '80%'];
    return (
      <View style={{ flex: 4, padding: 10 }}>
        {widths.map((w, i) => (
          <View
            key={i}
            style={[
              privateStyles.messageRow,
              i % 2 === 0 ? privateStyles.rowLeft : privateStyles.rowRight,
            ]}
          >
            <View
              style={[
                privateStyles.message,
                i % 2 === 0 ? privateStyles.left : privateStyles.right,
                { backgroundColor: darkMode ? '#444' : '#ddd', width: w, height: 20 },
              ]}
            />
          </View>
        ))}
      </View>
    );
  };

  const SelectedGameClient = activeGameId ? games[activeGameId].Client : null;
  const gameVisible = showGame && !keyboardOpen && !!SelectedGameClient;
  let gameSection = null;
  if (SelectedGameClient) {
    gameSection = (
      <View style={{ flex: 1 }}>
        <GameContainer
          visible={gameVisible}
          onToggleChat={() => setShowGame(false)}
          onClose={() => setShowGame(false)}
          player={{ name: 'You' }}
          opponent={{ name: user.displayName }}
        >
          {devMode && (
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => setDevPlayer('0')}
                style={{
                  backgroundColor: devPlayer === '0' ? theme.accent : '#ccc',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: '#fff' }}>Player 1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDevPlayer('1')}
                style={{
                  backgroundColor: devPlayer === '1' ? theme.accent : '#ccc',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#fff' }}>Player 2</Text>
              </TouchableOpacity>
            </View>
          )}
          <SelectedGameClient
            matchID={user.id}
            playerID={devMode ? devPlayer : '0'}
            onGameEnd={handleGameEnd}
          />
        </GameContainer>
      </View>
    );
  }

  const chatSection = (
    <View style={privateStyles.chatSection}>
      <FlatList
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingBottom: 0 }}
        inverted
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !loading && (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <EmptyState
                text="No messages yet."
                image={require('../assets/logo.png')}
              />
              {firstLine ? (
                <Text
                  style={{
                    textAlign: 'center',
                    color: theme.textSecondary,
                    marginTop: 4,
                  }}
                >
                  {`Try: "${firstLine}"`}
                </Text>
              ) : null}
              {firstGame ? (
                <Text
                  style={{
                    textAlign: 'center',
                    color: theme.textSecondary,
                    marginTop: 2,
                  }}
                >
                  {`Or invite them to play ${firstGame.title}`}
                </Text>
              ) : null}
            </View>
          )
        }
      />
      {isTyping && (
        <Text style={privateStyles.typingIndicator}>{user.displayName} is typing...</Text>
      )}
    </View>
  );

  const handlePlayPress = () => {
    if (activeGameId) {
      setShowGame((prev) => !prev);
    } else {
      setShowGameModal(true);
    }
  };

  const handleCancelGame = () => {
    setActiveGame(user.id, null);
    setShowGameMenu(false);
  };

  const handleChangeGame = () => {
    setShowGameModal(true);
    setShowGameMenu(false);
  };

  const inputBarBottom = keyboardOpen ? keyboardHeight : 0;
  const menuBottom = inputBarBottom + insets.bottom + INPUT_BAR_HEIGHT + 10;
  const playButtonText = activeGameId
    ? showGame
      ? 'Hide'
      : 'Show Game'
    : 'Play';
  const inputBar = (
      <View
        style={[
          privateStyles.inputBarContainer,
          { bottom: inputBarBottom + insets.bottom },
        ]}
      >
        <View style={privateStyles.inputBar}>
        <TouchableOpacity
          onLongPress={startRecording}
          onPressOut={handleVoiceFinish}
          style={{ marginRight: 6 }}
        >
          <Ionicons
            name={isRecording ? 'mic' : 'mic-outline'}
            size={22}
            color={theme.text}
          />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          placeholder="Type a message..."
          style={privateStyles.input}
          value={text}
          onChangeText={handleTextChange}
          placeholderTextColor="#888"
        />
        <TouchableOpacity
          style={[privateStyles.sendBtn, sending && { opacity: 0.6 }]}
          onPress={debouncedSend}
          disabled={sending}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={privateStyles.playButton}
          onPress={handlePlayPress}
          accessibilityLabel={playButtonText}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
            {playButtonText}
          </Text>
        </TouchableOpacity>
        {activeGameId && (
          <TouchableOpacity
            style={privateStyles.menuButton}
            onPress={() => setShowGameMenu((v) => !v)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
          </TouchableOpacity>
        )}
        </View>
      </View>
  );


  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      {gameResult ? (
        <View style={privateStyles.resultOverlay} pointerEvents="none">
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          {gameResult.winner === '0' ? (
            <LottieView
              source={require('../assets/confetti.json')}
              autoPlay
              loop={false}
              style={privateStyles.resultAnim}
            />
          ) : null}
          <Text style={privateStyles.resultText}>
            {gameResult.winner === '0'
              ? 'You win!'
              : gameResult.winner === '1'
              ? `${user.displayName} wins.`
              : 'Draw.'}
          </Text>
        </View>
      ) : null}
      <Modal
        visible={showGameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGameModal(false)}
      >
        <View style={privateStyles.modalOverlay}>
          <View style={privateStyles.modalContent}>
            <FlatList data={gameList} keyExtractor={(item) => item.id} renderItem={renderGameOption} />
            <TouchableOpacity
              style={[privateStyles.sendBtn, { marginTop: 10 }]}
              onPress={() => setShowGameModal(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScreenContainer>
        <SafeKeyboardView style={{ flex: 1, paddingTop: HEADER_SPACING }}>
          <View style={[privateStyles.gameWrapper, { height: gameVisible ? BOARD_HEIGHT : 0 }]}>
            {gameSection}
          </View>
          <ChatContainer style={privateStyles.chatWrapper}>
            {showPlaceholders ? (
              <PlaceholderBubbles />
            ) : loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Loader />
              </View>
            ) : (
              chatSection
            )}
            {inputBar}
          </ChatContainer>
          <GameMenu
            visible={showGameMenu}
            bottom={menuBottom}
            onCancel={handleCancelGame}
            onChange={handleChangeGame}
          />
        </SafeKeyboardView>
      </ScreenContainer>
    </GradientBackground>
  );
}

const getPrivateStyles = (theme) =>
  StyleSheet.create({
  content: {
    flex: 1,
  },
  gameWrapper: {
    overflow: 'hidden',
  },
  chatWrapper: {
    flex: 1,
  },
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
  readReceipt: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  inputBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: theme.background,
    height: INPUT_BAR_HEIGHT,
    justifyContent: 'center',
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
  playButton: {
    backgroundColor: '#009688',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: 'center',
    marginLeft: 8,
  },
  menuButton: {
    backgroundColor: '#009688',
    padding: 6,
    borderRadius: 16,
    alignSelf: 'center',
    marginLeft: 4,
  },
  gameMenu: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#009688',
    borderRadius: 8,
    padding: 8,
  },
  gameMenuItem: {
    color: '#fff',
    paddingVertical: 6,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 6,
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
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0009',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultAnim: { width: 250, height: 250 },
  resultText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  typingIndicator: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  chatSection: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: INPUT_BAR_HEIGHT,
  },
  });

/********************
 * Group chat view *
 *******************/
function GroupChat({ event }) {
  const flatListRef = useRef();
  const { theme } = useTheme();
  const { user } = useUser();
  const groupStyles = getGroupStyles(theme);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [input, setInput] = useState('');
  const [reactionTarget, setReactionTarget] = useState(null);

  useEffect(() => {
    const q = firebase
      .firestore()
      .collection('events')
      .doc(event.id)
      .collection('messages')
      .orderBy('timestamp', 'asc');
    setLoading(true);
    const unsub = q.onSnapshot((snap) => {
      const data = snap.docs.map((d) => {
        const val = d.data();
        return {
          id: d.id,
          user: val.user,
          userId: val.userId,
          reactions: val.reactions || [],
          pinned: !!val.pinned,
          time: val.timestamp?.toDate?.().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          }),
          text: val.text,
        };
      });
      setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, [event.id]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    try {
      await firebase
        .firestore()
        .collection('events')
        .doc(event.id)
        .collection('messages')
        .add({
          user: user?.displayName || 'You',
          userId: user?.uid || null,
          text: input.trim(),
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          reactions: [],
          pinned: false,
        });
      setInput('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Toast.show({ type: 'success', text1: 'Message sent' });
    } catch (e) {
      console.warn('Failed to send message', e);
      Toast.show({ type: 'error', text1: 'Failed to send message' });
    }
  };

  const [debouncedSend, sending] = useDebouncedCallback(sendMessage, 800);

  const addReaction = async (msgId, emoji) => {
    try {
      await firebase
        .firestore()
        .collection('events')
        .doc(event.id)
        .collection('messages')
        .doc(msgId)
        .update({ reactions: firebase.firestore.FieldValue.arrayUnion(emoji) });
    } catch (e) {
      console.warn('Failed to add reaction', e);
    }
    setReactionTarget(null);
  };

  const pinMessage = async (msgId) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;
    try {
      await firebase
        .firestore()
        .collection('events')
        .doc(event.id)
        .collection('messages')
        .doc(msgId)
        .update({ pinned: !msg.pinned });
    } catch (e) {
      console.warn('Failed to pin message', e);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const snap = await firebase
        .firestore()
        .collection('events')
        .doc(event.id)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get();
      const data = snap.docs.map((d) => {
        const val = d.data();
        return {
          id: d.id,
          user: val.user,
          userId: val.userId,
          reactions: val.reactions || [],
          pinned: !!val.pinned,
          time: val.timestamp?.toDate?.().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          }),
          text: val.text,
        };
      });
      setMessages(data);
    } catch (e) {
      console.warn('Failed to refresh messages', e);
    }
    setRefreshing(false);
  };

  const renderMessage = ({ item }) => (
    <TouchableOpacity
      onLongPress={() => setReactionTarget(item.id)}
      style={[
        groupStyles.messageBubble,
        item.userId === user?.uid ? groupStyles.userBubble : groupStyles.otherBubble,
      ]}
    >
      <View style={groupStyles.senderRow}>
        <Text style={groupStyles.sender}>{item.userId === user?.uid ? 'You' : item.user}</Text>
        {item.pinned && <Text style={groupStyles.pinIcon}>📌</Text>}
      </View>
      <Text style={groupStyles.text}>{item.text}</Text>
      <Text style={groupStyles.time}>{item.time}</Text>

      {item.reactions.length > 0 && (
        <View style={groupStyles.reactionRow}>
          {item.reactions.map((emoji, i) => (
            <Text key={i} style={groupStyles.reactionEmoji}>
              {emoji}
            </Text>
          ))}
        </View>
      )}

      {reactionTarget === item.id && (
        <View style={groupStyles.reactionBar}>
          {REACTIONS.map((emoji, i) => (
            <TouchableOpacity key={i} onPress={() => addReaction(item.id, emoji)}>
              <Text style={groupStyles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {item.user === 'Host' && (
        <TouchableOpacity onPress={() => pinMessage(item.id)}>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            {item.pinned ? '📌 Unpin' : '📍 Pin Message'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      <SafeKeyboardView style={[groupStyles.container, { paddingTop: HEADER_SPACING }]}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Loader />
          </View>
        ) : (
          <>
            <Text style={groupStyles.eventTitle}>{event.title}</Text>

            {messages.filter((m) => m.pinned).map((msg) => (
              <View key={msg.id} style={groupStyles.pinnedBanner}>
                <Text style={groupStyles.pinnedText}>📌 {msg.text}</Text>
              </View>
            ))}

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              ListEmptyComponent={
                <EmptyState
                  text="No messages yet."
                  image={require('../assets/logo.png')}
                />
              }
            />
          </>
        )}

        <View style={groupStyles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            style={groupStyles.input}
          />
          <TouchableOpacity
            onPress={debouncedSend}
            disabled={sending}
            style={[groupStyles.sendBtn, sending && { opacity: 0.6 }]}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </SafeKeyboardView>
    </GradientBackground>
  );
}

const getGroupStyles = (theme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  eventTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: HEADER_SPACING,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: theme.accent,
    alignSelf: 'flex-end',
  },
  otherBubble: {
    backgroundColor: '#ccc',
    alignSelf: 'flex-start',
  },
  sender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  text: {
    fontSize: 14,
    color: '#fff',
  },
  time: {
    fontSize: 11,
    color: '#eee',
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: theme.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reactionRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  reactionBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 6,
    marginTop: 6,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  pinIcon: {
    marginLeft: 4,
    fontSize: 12,
    color: '#fff',
  },
  pinnedBanner: {
    backgroundColor: '#fff3cd',
    padding: 10,
    margin: 10,
    borderRadius: 8,
  },
  pinnedText: {
    fontSize: 13,
    color: '#8a6d3b',
  },
});

/**************************
 * Exported chat wrapper  *
 *************************/
export default function ChatScreen({ route }) {
  const { user: paramUser, event } = route.params || {};
  const { matches } = useChats();
  const { theme } = useTheme();

  if (event) return <GroupChat event={event} />;

  const match = matches.find(
    (m) => m.id === paramUser?.id || m.otherUserId === paramUser?.id
  );

  if (!match) {
    return (
      <GradientBackground style={{ flex: 1 }}>
        <Header />
        <EmptyState
          text="No match found."
          image={require('../assets/logo.png')}
          style={{ marginTop: 40 }}
        />
      </GradientBackground>
    );
  }

  return <PrivateChat user={match} />;
}

ChatScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      user: PropTypes.shape({
        id: PropTypes.string,
        displayName: PropTypes.string,
        image: PropTypes.any,
      }),
      event: PropTypes.object,
    }),
  }).isRequired,
};
