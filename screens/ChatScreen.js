import React from 'react';
import PropTypes from 'prop-types';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import SafeKeyboardView from '../components/SafeKeyboardView';
import { HEADER_SPACING } from '../layout';
import { useMatches } from '../contexts/MatchesContext';

import PrivateChat from './PrivateChat';

export { default as PrivateChat } from './PrivateChat';

export default function ChatScreen({ route }) {
  const { user: paramUser, gameId, chatId } = route.params || {};
  const { matches, addMatch } = useMatches();


  let match = matches.find(
    (m) => m.id === (chatId || paramUser?.id) || m.otherUserId === paramUser?.id
  );

  if (!match && paramUser && chatId) {
    match = { ...paramUser, id: chatId };
    addMatch(match);
  }

  if (!match) {
    return (
      <GradientBackground style={{ flex: 1 }}>
        <Header />
        <SafeKeyboardView style={{ flex: 1, paddingTop: HEADER_SPACING }} offset={0}>
          <EmptyState
            text="No match found."
            image={require('../assets/logo.png')}
            style={{ marginTop: 40 }}
          />
        </SafeKeyboardView>
      </GradientBackground>
    );
  }

  return <PrivateChat user={match} initialGameId={gameId} />;
}

ChatScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      user: PropTypes.shape({
        id: PropTypes.string,
        displayName: PropTypes.string,
        image: PropTypes.any,
      }),
      gameId: PropTypes.string,
      chatId: PropTypes.string,
    }),
  }).isRequired,
};
