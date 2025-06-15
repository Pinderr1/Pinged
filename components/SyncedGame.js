import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import useGameSession from '../hooks/useGameSession';
import { games } from '../games';

export default function SyncedGame({ sessionId, gameId, opponentId, onGameEnd }) {
  const { Board } = games[gameId] || {};
  const { G, ctx, moves, loading } = useGameSession(sessionId, gameId, opponentId);

  if (!Board) return null;
  if (loading || !G) {
    return (
      <View style={{ padding: 20 }}>
        <ActivityIndicator size="large" color="#d81b60" />
      </View>
    );
  }

  return <Board G={G} ctx={ctx} moves={moves} onGameEnd={onGameEnd} />;
}
