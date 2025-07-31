import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Dimensions, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import GameContainer from './GameContainer';
import GameMenu from './GameMenu';
import GamePickerModal from './GamePickerModal';
import GradientButton from './GradientButton';
import { games, gameList } from '../games';
import { useChats } from '../contexts/ChatContext';
import { useTheme } from '../contexts/ThemeContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import useRequireGameCredits from '../hooks/useRequireGameCredits';
import { useNotification } from '../contexts/NotificationContext';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const BOARD_HEIGHT = Dimensions.get('window').height / 2;

export default function GameBar({ matchId, user }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { sendMessage, setActiveGame, getActiveGame, getSavedGameState, saveGameState, clearGameState } = useChats();
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const requireCredits = useRequireGameCredits();
  const { sendGameInvite } = useMatchmaking();
  const { showNotification } = useNotification();
  const [showGame, setShowGame] = useState(true);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [savedState, setSavedState] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [inviting, setInviting] = useState(false);
  const activeGameId = getActiveGame(matchId);
  const canPlay = gamesLeft > 0;
  const winSound = useRef(null);
  const loseSound = useRef(null);
  const drawSound = useRef(null);

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
    if (!activeGameId) {
      setSavedState(null);
      return;
    }
    let isMounted = true;
    getSavedGameState(matchId).then((s) => {
      if (isMounted) setSavedState(s);
    });
    return () => {
      isMounted = false;
    };
  }, [activeGameId, matchId]);

  useEffect(() => {
    if (activeGameId) {
      const title = games[activeGameId].meta.title;
      showNotification(`Game started: ${title}`);
    }
  }, [activeGameId]);

  const handleStateChange = (state) => {
    if (activeGameId) saveGameState(matchId, state);
  };

  const playSound = async (type) => {
    try {
      if (type === 'win') await winSound.current?.replayAsync();
      else if (type === 'lose') await loseSound.current?.replayAsync();
      else if (type === 'draw') await drawSound.current?.replayAsync();
    } catch (e) {
      console.warn('Failed to play sound', e);
    }
  };

  const handleGameEnd = (result) => {
    if (!result) return;
    setGameResult(result);
    if (result.winner !== undefined) {
      const msg = result.winner === '0' ? 'You win!' : `${user.displayName} wins.`;
      sendMessage({ matchId, text: `Game over. ${msg}`, meta: { system: true } });
      if (result.winner === '0') {
        playSound('win');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else if (result.winner === '1') {
        playSound('lose');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } else if (result.draw) {
      sendMessage({ matchId, text: 'Game over. Draw.', meta: { system: true } });
      playSound('draw');
      Haptics.selectionAsync().catch(() => {});
    }
    setTimeout(() => {
      setActiveGame(matchId, null);
      clearGameState(matchId);
    }, 2000);
  };

  useEffect(() => {
    if (gameResult) {
      const t = setTimeout(() => setGameResult(null), 2000);
      return () => clearTimeout(t);
    }
  }, [gameResult]);

  const handleGameSelect = (gameId) => {
    if (!requireCredits()) {
      setShowGameModal(false);
      return;
    }
    const title = games[gameId].meta.title;
    if (activeGameId && activeGameId !== gameId) {
      sendMessage({ matchId, text: `Switched game to ${title}`, meta: { system: true } });
    } else if (!activeGameId) {
      sendMessage({ matchId, text: `Game started: ${title}`, meta: { system: true } });
      recordGamePlayed();
    }
    setActiveGame(matchId, gameId);
    setShowGameModal(false);
  };

  const handlePlayPress = () => {
    if (activeGameId) {
      setShowGame((prev) => !prev);
    } else {
      setShowGameModal(true);
    }
  };

  const handleCancelGame = () => {
    setActiveGame(matchId, null);
    clearGameState(matchId);
    setShowGameMenu(false);
  };

  const handleChangeGame = () => {
    setShowGameModal(true);
    setShowGameMenu(false);
  };

  const handleInviteSelect = async (game) => {
    setShowGameModal(false);
    if (!game || inviting) return;
    if (!canPlay || !requireCredits()) return;
    setInviting(true);
    try {
      await sendGameInvite(matchId, game.id);
      recordGamePlayed();
      Toast.show({ type: "success", text1: "Invite sent!" });
    } catch (e) {
      console.warn("Failed to send invite", e);
      Toast.show({ type: "error", text1: "Failed to send invite" });
    } finally {
      setInviting(false);
    }
  };

  const gameVisible = showGame && !!activeGameId;
  const SelectedGameClient = activeGameId ? games[activeGameId].Client : null;

  return (
    <View>
      <GradientButton
        text="Play Game"
        width={160}
        onPress={handlePlayPress}
        style={{ alignSelf: 'center' }}
        disabled={!canPlay}
      />
      <View style={{ height: gameVisible ? BOARD_HEIGHT : 0 }}>
        {SelectedGameClient && (
          <GameContainer
            visible={gameVisible}
            onToggleChat={() => setShowGame(false)}
            onClose={() => setShowGame(false)}
            player={{ name: 'You' }}
            opponent={{ name: user.displayName }}
            showHeader={false}
          >
            <SelectedGameClient
              matchID={matchId}
              playerID="0"
              onGameEnd={handleGameEnd}
              initialState={savedState}
              onStateChange={handleStateChange}
            />
          </GameContainer>
        )}
      </View>
      <GameMenu
        visible={showGameMenu}
        bottom={INPUT_BAR_HEIGHT + 10}
        onCancel={handleCancelGame}
        onChange={handleChangeGame}
      />
      <GamePickerModal visible={showGameModal} onSelect={handleGameSelect} onClose={() => setShowGameModal(false)} />
      {gameResult && (
        <View style={styles.resultOverlay} pointerEvents="none">
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          {gameResult.winner === '0' && <LottieView source={require('../assets/confetti.json')} autoPlay loop={false} style={styles.resultAnim} />}
          <Text style={styles.resultText}>
            {gameResult.winner === '0' ? 'You win!' : gameResult.winner === '1' ? `${user.displayName} wins.` : 'Draw.'}
          </Text>
        </View>
      )}
    </View>
  );
}

GameBar.propTypes = {
  matchId: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
};

const INPUT_BAR_HEIGHT = 70;

const getStyles = (theme) =>
  StyleSheet.create({
    resultOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#0009',
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultAnim: { width: 250, height: 250 },
    resultText: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 20 },
  });

