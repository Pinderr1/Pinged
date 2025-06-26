import React from 'react';
import GameSessionScreen from './GameSessionScreen';

export default function GameLobbyScreen(props) {
  return <GameSessionScreen {...props} sessionType="live" />;
}
