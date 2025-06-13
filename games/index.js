import TicTacToeClient, { meta as ticTacToeMeta } from './tic-tac-toe';

export const games = {
  [ticTacToeMeta.id]: { Client: TicTacToeClient, meta: ticTacToeMeta },
};

export const gameList = Object.values(games).map(({ meta }) => ({
  id: meta.id,
  title: meta.title,
}));
