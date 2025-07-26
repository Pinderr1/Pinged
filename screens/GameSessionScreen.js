import React from 'react';
import LiveGameSession from './LiveGameSession';
import BotGameSession from './BotGameSession';
import SpectatorGameSession from './SpectatorGameSession';
import PropTypes from 'prop-types';

const GameSessionScreen = ({ route, navigation, sessionType }) => {
  const type =
    sessionType || route.params?.sessionType || (route.params?.botId ? 'bot' : 'live');
  if (type === 'bot') {
    return <BotGameSession route={route} navigation={navigation} />;
  }
  if (type === 'spectator') {
    return <SpectatorGameSession route={route} navigation={navigation} />;
  }
  return <LiveGameSession route={route} navigation={navigation} />;
};

GameSessionScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
  route: PropTypes.object.isRequired,
  sessionType: PropTypes.string,
};

export { LiveGameSession, BotGameSession, SpectatorGameSession };
export default GameSessionScreen;
