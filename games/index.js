import TicTacToeClient, { meta as ticTacToeMeta } from './tic-tac-toe';
import RPSClient, { meta as rpsMeta } from './rock-paper-scissors';
import ConnectFourClient, { meta as connectFourMeta } from './connect-four';
import GomokuClient, { meta as gomokuMeta } from './gomoku';
import MemoryMatchClient, { meta as memoryMatchMeta } from './memory-match';
import HangmanClient, { meta as hangmanMeta } from './hangman';
import MinesweeperClient, { meta as minesweeperMeta } from './minesweeper';
import SudokuClient, { meta as sudokuMeta } from './sudoku';
import GuessNumberClient, { meta as guessNumberMeta } from './guess-number';

export const games = {
  [ticTacToeMeta.id]: { Client: TicTacToeClient, meta: ticTacToeMeta },
  [rpsMeta.id]: { Client: RPSClient, meta: rpsMeta },
  [connectFourMeta.id]: { Client: ConnectFourClient, meta: connectFourMeta },
  [gomokuMeta.id]: { Client: GomokuClient, meta: gomokuMeta },
  [memoryMatchMeta.id]: { Client: MemoryMatchClient, meta: memoryMatchMeta },
  [hangmanMeta.id]: { Client: HangmanClient, meta: hangmanMeta },
  [minesweeperMeta.id]: { Client: MinesweeperClient, meta: minesweeperMeta },
  [sudokuMeta.id]: { Client: SudokuClient, meta: sudokuMeta },
  [guessNumberMeta.id]: { Client: GuessNumberClient, meta: guessNumberMeta },
};

export const gameList = Object.values(games).map(({ meta }) => ({
  id: meta.id,
  title: meta.title,
}));
