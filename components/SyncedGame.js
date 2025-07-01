import React from 'react';
import { View } from 'react-native';
import Loader from './Loader';
import useGameSession from '../hooks/useGameSession';
import { games } from '../games';
import PropTypes from 'prop-types';

export default function SyncedGame({
  sessionId,
  gameId,
  opponentId,
  onGameEnd,
  player1,
  player2,
  visible = true,
  onToggleChat,
}) {
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

  return (
    <Board
      G={G}
      ctx={ctx}
      moves={moves}
      onGameEnd={onGameEnd}
      player1={player1}
      player2={player2}
      visible={visible}
      onToggleChat={onToggleChat}
    />
  );
}

SyncedGame.propTypes = {
  sessionId: PropTypes.string.isRequired,
  gameId: PropTypes.string.isRequired,
  opponentId: PropTypes.string.isRequired,
  onGameEnd: PropTypes.func.isRequired,
  player1: PropTypes.object,
  player2: PropTypes.object,
  visible: PropTypes.bool,
  onToggleChat: PropTypes.func,
};
