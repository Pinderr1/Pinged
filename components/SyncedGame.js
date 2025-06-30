import React from 'react';
import { View } from 'react-native';
import Loader from './Loader';
import useGameSession from '../hooks/useGameSession';
import { games } from '../games';
import PropTypes from 'prop-types';

export default function SyncedGame({ sessionId, gameId, opponentId, onGameEnd }) {
  const { Board } = games[gameId] || {};
  const { G, ctx, moves, loading } = useGameSession(sessionId, gameId, opponentId);

  if (!Board) return null;
  if (loading || !G) {
    return (
      <View style={{ padding: 20 }}>
        <Loader />
      </View>
    );
  }

  return <Board G={G} ctx={ctx} moves={moves} onGameEnd={onGameEnd} />;
}

SyncedGame.propTypes = {
  sessionId: PropTypes.string.isRequired,
  gameId: PropTypes.string.isRequired,
  opponentId: PropTypes.string.isRequired,
  onGameEnd: PropTypes.func.isRequired,
};
