import React from 'react';
import { View } from 'react-native';
import Loader from './Loader';
import useGameSession from '../hooks/useGameSession';
import { games } from '../games';
import PropTypes from 'prop-types';
import ArcadeGameWrapper from './ArcadeGameWrapper';
import { useUser } from '../contexts/UserContext';

export default function SyncedGame({ sessionId, gameId, opponent, onGameEnd }) {
  const { user } = useUser();
  const { Board, meta } = games[gameId] || {};
  const { G, ctx, moves, loading } = useGameSession(sessionId, gameId, opponent?.id);

  if (!Board) return null;
  if (loading || !G) {
    return (
      <View style={{ padding: 20 }}>
        <Loader />
      </View>
    );
  }

  return (
    <ArcadeGameWrapper
      title={meta?.title}
      icon={meta?.icon}
      player={{ photo: user?.photoURL, online: true }}
      opponent={{ photo: opponent?.photo, online: opponent?.online }}
      turn={ctx.currentPlayer}
    >
      <Board G={G} ctx={ctx} moves={moves} onGameEnd={onGameEnd} />
    </ArcadeGameWrapper>
  );
}

SyncedGame.propTypes = {
  sessionId: PropTypes.string.isRequired,
  gameId: PropTypes.string.isRequired,
  opponent: PropTypes.object,
  onGameEnd: PropTypes.func.isRequired,
};
