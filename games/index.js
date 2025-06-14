import TicTacToeClient, { meta as ticTacToeMeta } from './tic-tac-toe';
import RPSClient, { meta as rpsMeta } from './rock-paper-scissors';
import ConnectFourClient, { meta as connectFourMeta } from './connect-four';
import GomokuClient, { meta as gomokuMeta } from './gomoku';
import MemoryMatchClient, { meta as memoryMatchMeta } from './memory-match';
import HangmanClient, { meta as hangmanMeta } from './hangman';

export const games = {
  [ticTacToeMeta.id]: { Client: TicTacToeClient, meta: ticTacToeMeta },
  [rpsMeta.id]: { Client: RPSClient, meta: rpsMeta },
  [connectFourMeta.id]: { Client: ConnectFourClient, meta: connectFourMeta },
  [gomokuMeta.id]: { Client: GomokuClient, meta: gomokuMeta },
  [memoryMatchMeta.id]: { Client: MemoryMatchClient, meta: memoryMatchMeta },
  [hangmanMeta.id]: { Client: HangmanClient, meta: hangmanMeta },
};

export const gameList = Object.values(games).map(({ meta }) => ({
  id: meta.id,
  title: meta.title,
}));
