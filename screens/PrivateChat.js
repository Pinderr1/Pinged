import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import SafeKeyboardView from '../components/SafeKeyboardView';
import ScreenContainer from '../components/ScreenContainer';
import ChatContainer from '../components/ChatContainer';
import ChatMessagesList from '../components/ChatMessagesList';
import ChatInputBar from '../components/ChatInputBar';
import GameBar from '../components/GameBar';
import { useGame } from '../contexts/GameContext';
import { useMatches } from '../contexts/MatchesContext';
import { useMatchmaking } from '../contexts/MatchmakingContext';
import { useUser } from '../contexts/UserContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { useTheme } from '../contexts/ThemeContext';
import { HEADER_SPACING } from '../layout';

export default function PrivateChat({ user, initialGameId }) {
  const { user: currentUser, blocked } = useUser();
  const { gamesLeft } = useGameLimit();
  const { setActiveGame, getActiveGame } = useGame();
  const { sendMessage } = useMatches();
  const { sendGameInvite } = useMatchmaking();
  const insets = useSafeAreaInsets();
  const { theme, darkMode } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    const active = getActiveGame(user.id);
    if (initialGameId && !active) {
      setActiveGame(user.id, initialGameId);
    }
  }, [initialGameId, user.id]);

  const isBlocked = Array.isArray(blocked) && blocked.includes(user.otherUserId || user.id);
  const canPlay = gamesLeft > 0 && !isBlocked;

  return (
    <GradientBackground style={{ flex: 1 }}>
      <Header />
      <SafeKeyboardView offset={insets.top + 80} style={{ flex: 1, paddingTop: HEADER_SPACING }}>
        <ScreenContainer scroll contentContainerStyle={{ paddingBottom: 120 }}>
          <GameBar matchId={user.id} user={user} />
          <ChatContainer style={styles.chatWrapper}>
          <ChatMessagesList
            matchId={user.id}
            user={user}
            currentUser={currentUser}
            theme={theme}
            darkMode={darkMode}
          />
          <ChatInputBar
            matchId={user.id}
            canPlay={canPlay}
            onPlayPress={() => {}}
            currentUser={currentUser}
            theme={theme}
            sendMessage={sendMessage}
            sendGameInvite={sendGameInvite}
          />
          </ChatContainer>
        </ScreenContainer>
      </SafeKeyboardView>
    </GradientBackground>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    chatWrapper: { flex: 1 },
  });

