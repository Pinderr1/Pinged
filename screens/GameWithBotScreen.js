import React from 'react';
import GameSessionScreen from './GameSessionScreen';

export default function GameWithBotScreen(props) {
  return <GameSessionScreen {...props} sessionType="bot" />;
}
