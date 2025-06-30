import React from 'react';
import GameSessionScreen from './GameSessionScreen';
import PropTypes from 'prop-types';

export default function GameWithBotScreen(props) {
  return <GameSessionScreen {...props} sessionType="bot" />;
}

GameWithBotScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
  route: PropTypes.object,
};
