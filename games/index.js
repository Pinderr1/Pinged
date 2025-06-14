import TicTacToeClient, { meta as ticTacToeMeta } from './tic-tac-toe';
import RPSClient, { meta as rpsMeta } from './rock-paper-scissors';
import ConnectFourClient, { meta as connectFourMeta } from './connect-four';

export const games = {
  [ticTacToeMeta.id]: { Client: TicTacToeClient, meta: ticTacToeMeta },
  [rpsMeta.id]: { Client: RPSClient, meta: rpsMeta },
  [connectFourMeta.id]: { Client: ConnectFourClient, meta: connectFourMeta },
};

export const gameList = Object.values(games).map(({ meta }) => ({
  id: meta.id,
  title: meta.title,
}));
