import React from 'react';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import PropTypes from 'prop-types';
import { useChats } from '../contexts/ChatContext';
import PrivateChat from './PrivateChat';
import GroupChat from './GroupChat';

export { default as PrivateChat } from './PrivateChat';
export { default as GroupChat } from './GroupChat';

export default function ChatScreen({ route }) {
  const { user: paramUser, event } = route.params || {};
  const { matches } = useChats();

  if (event) {
    return <GroupChat event={event} />;
  }

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
