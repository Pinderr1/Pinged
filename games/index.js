import TicTacToeClient, { Game as ticTacToeGame, Board as TicTacToeBoard, meta as ticTacToeMeta } from './tic-tac-toe';
import RPSClient, { Game as rpsGame, Board as RPSBoard, meta as rpsMeta } from './rock-paper-scissors';
import ConnectFourClient, { Game as connectFourGame, Board as ConnectFourBoard, meta as connectFourMeta } from './connect-four';
import GomokuClient, { Game as gomokuGame, Board as GomokuBoard, meta as gomokuMeta } from './gomoku';
import MemoryMatchClient, { Game as memoryMatchGame, Board as MemoryMatchBoard, meta as memoryMatchMeta } from './memory-match';
import HangmanClient, { Game as hangmanGame, Board as HangmanBoard, meta as hangmanMeta } from './hangman';
import MinesweeperClient, { Game as minesweeperGame, Board as MinesweeperBoard, meta as minesweeperMeta } from './minesweeper';
import SudokuClient, { Game as sudokuGame, Board as SudokuBoard, meta as sudokuMeta } from './sudoku';
import GuessNumberClient, { Game as guessNumberGame, Board as GuessNumberBoard, meta as guessNumberMeta } from './guess-number';
import BattleshipClient, { Game as battleshipGame, Board as BattleshipBoard, meta as battleshipMeta } from './battleship';
import CheckersClient, { Game as checkersGame, Board as CheckersBoard, meta as checkersMeta } from './checkers';
import DominoesClient, { Game as dominoesGame, Board as DominoesBoard, meta as dominoesMeta } from './dominoes';
import DotsBoxesClient, { Game as dotsBoxesGame, Board as DotsBoxesBoard, meta as dotsBoxesMeta } from './dots-and-boxes';
import SnakesLaddersClient, { Game as snakesLaddersGame, Board as SnakesLaddersBoard, meta as snakesLaddersMeta } from './snakes-and-ladders';
import MancalaClient, { Game as mancalaGame, Board as MancalaBoard, meta as mancalaMeta } from './mancala';

export const games = {
  [ticTacToeMeta.id]: {
    Client: TicTacToeClient,
    Game: ticTacToeGame,
    Board: TicTacToeBoard,
    meta: ticTacToeMeta,
  },
  [rpsMeta.id]: { Client: RPSClient, Game: rpsGame, Board: RPSBoard, meta: rpsMeta },
  [connectFourMeta.id]: {
    Client: ConnectFourClient,
    Game: connectFourGame,
    Board: ConnectFourBoard,
    meta: connectFourMeta,
  },
  [gomokuMeta.id]: { Client: GomokuClient, Game: gomokuGame, Board: GomokuBoard, meta: gomokuMeta },
  [memoryMatchMeta.id]: {
    Client: MemoryMatchClient,
    Game: memoryMatchGame,
    Board: MemoryMatchBoard,
    meta: memoryMatchMeta,
  },
  [hangmanMeta.id]: { Client: HangmanClient, Game: hangmanGame, Board: HangmanBoard, meta: hangmanMeta },
  [minesweeperMeta.id]: {
    Client: MinesweeperClient,
    Game: minesweeperGame,
    Board: MinesweeperBoard,
    meta: minesweeperMeta,
  },
  [sudokuMeta.id]: { Client: SudokuClient, Game: sudokuGame, Board: SudokuBoard, meta: sudokuMeta },
  [guessNumberMeta.id]: {
    Client: GuessNumberClient,
    Game: guessNumberGame,
    Board: GuessNumberBoard,
    meta: guessNumberMeta,
  },
  [checkersMeta.id]: {
    Client: CheckersClient,
    Game: checkersGame,
    Board: CheckersBoard,
    meta: checkersMeta,
  },
  [dominoesMeta.id]: {
    Client: DominoesClient,
    Game: dominoesGame,
    Board: DominoesBoard,
    meta: dominoesMeta,
  },
  [battleshipMeta.id]: {
    Client: BattleshipClient,
    Game: battleshipGame,
    Board: BattleshipBoard,
    meta: battleshipMeta,
  },
  [dotsBoxesMeta.id]: {
    Client: DotsBoxesClient,
    Game: dotsBoxesGame,
    Board: DotsBoxesBoard,
    meta: dotsBoxesMeta,
  },
  [mancalaMeta.id]: {
    Client: MancalaClient,
    Game: mancalaGame,
    Board: MancalaBoard,
    meta: mancalaMeta,
  },
  [snakesLaddersMeta.id]: {
    Client: SnakesLaddersClient,
    Game: snakesLaddersGame,
    Board: SnakesLaddersBoard,
    meta: snakesLaddersMeta,
  },
};

export const gameList = Object.values(games).map(({ meta }) => ({
  id: meta.id,
  title: meta.title,
}));
