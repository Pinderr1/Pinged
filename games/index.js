import React from 'react';
import TicTacToeClient, { Game as ticTacToeGame, Board as TicTacToeBoard, meta as ticTacToeMeta } from './tic-tac-toe';
import RPSClient, { Game as rpsGame, Board as RPSBoard, meta as rpsMeta } from './rock-paper-scissors';
import ConnectFourClient, { Game as connectFourGame, Board as ConnectFourBoard, meta as connectFourMeta } from './connect-four';
import GomokuClient, { Game as gomokuGame, Board as GomokuBoard, meta as gomokuMeta } from './gomoku';
import MemoryMatchClient, { Game as memoryMatchGame, Board as MemoryMatchBoard, meta as memoryMatchMeta } from './memory-match';
import GameContainer from '../components/GameContainer';
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
import BlackjackClient, { Game as blackjackGame, Board as BlackjackBoard, meta as blackjackMeta } from './blackjack';
import NimClient, { Game as nimGame, Board as NimBoard, meta as nimMeta } from './nim';
import PigClient, { Game as pigGame, Board as PigBoard, meta as pigMeta } from './pig';
import CoinTossClient, { Game as coinTossGame, Board as CoinTossBoard, meta as coinTossMeta } from './coin-toss';
import FlirtyQuestionsClient, { Game as flirtyQuestionsGame, Board as FlirtyQuestionsBoard, meta as flirtyQuestionsMeta } from './flirty-questions';

const withContainer = (Board) => (props) => (
  <GameContainer
    player1={props.player1}
    player2={props.player2}
    onToggleChat={props.onToggleChat}
    visible={props.visible}
  >
    <Board {...props} />
  </GameContainer>
);

export const games = {
  [ticTacToeMeta.id]: {
    Client: TicTacToeClient,
    Game: ticTacToeGame,
    Board: withContainer(TicTacToeBoard),
    meta: ticTacToeMeta,
  },
  [rpsMeta.id]: {
    Client: RPSClient,
    Game: rpsGame,
    Board: withContainer(RPSBoard),
    meta: rpsMeta,
  },
  [connectFourMeta.id]: {
    Client: ConnectFourClient,
    Game: connectFourGame,
    Board: withContainer(ConnectFourBoard),
    meta: connectFourMeta,
  },
  [gomokuMeta.id]: {
    Client: GomokuClient,
    Game: gomokuGame,
    Board: withContainer(GomokuBoard),
    meta: gomokuMeta,
  },
  [memoryMatchMeta.id]: {
    Client: MemoryMatchClient,
    Game: memoryMatchGame,
    Board: withContainer(MemoryMatchBoard),
    meta: memoryMatchMeta,
  },
  [hangmanMeta.id]: {
    Client: HangmanClient,
    Game: hangmanGame,
    Board: withContainer(HangmanBoard),
    meta: hangmanMeta,
  },
  [minesweeperMeta.id]: {
    Client: MinesweeperClient,
    Game: minesweeperGame,
    Board: withContainer(MinesweeperBoard),
    meta: minesweeperMeta,
  },
  [sudokuMeta.id]: {
    Client: SudokuClient,
    Game: sudokuGame,
    Board: withContainer(SudokuBoard),
    meta: sudokuMeta,
  },
  [guessNumberMeta.id]: {
    Client: GuessNumberClient,
    Game: guessNumberGame,
    Board: withContainer(GuessNumberBoard),
    meta: guessNumberMeta,
  },
  [checkersMeta.id]: {
    Client: CheckersClient,
    Game: checkersGame,
    Board: withContainer(CheckersBoard),
    meta: checkersMeta,
  },
  [dominoesMeta.id]: {
    Client: DominoesClient,
    Game: dominoesGame,
    Board: withContainer(DominoesBoard),
    meta: dominoesMeta,
  },
  [battleshipMeta.id]: {
    Client: BattleshipClient,
    Game: battleshipGame,
    Board: withContainer(BattleshipBoard),
    meta: battleshipMeta,
  },
  [dotsBoxesMeta.id]: {
    Client: DotsBoxesClient,
    Game: dotsBoxesGame,
    Board: withContainer(DotsBoxesBoard),
    meta: dotsBoxesMeta,
  },
  [mancalaMeta.id]: {
    Client: MancalaClient,
    Game: mancalaGame,
    Board: withContainer(MancalaBoard),
    meta: mancalaMeta,
  },
  [snakesLaddersMeta.id]: {
    Client: SnakesLaddersClient,
    Game: snakesLaddersGame,
    Board: withContainer(SnakesLaddersBoard),
    meta: snakesLaddersMeta,
  },
  [blackjackMeta.id]: {
    Client: BlackjackClient,
    Game: blackjackGame,
    Board: withContainer(BlackjackBoard),
    meta: blackjackMeta,
  },
  [nimMeta.id]: {
    Client: NimClient,
    Game: nimGame,
    Board: withContainer(NimBoard),
    meta: nimMeta,
  },
  [pigMeta.id]: {
    Client: PigClient,
    Game: pigGame,
    Board: withContainer(PigBoard),
    meta: pigMeta,
  },
  [flirtyQuestionsMeta.id]: {
    Client: FlirtyQuestionsClient,
    Game: flirtyQuestionsGame,
    Board: withContainer(FlirtyQuestionsBoard),
    meta: flirtyQuestionsMeta,
  },
  [coinTossMeta.id]: {
    Client: CoinTossClient,
    Game: coinTossGame,
    Board: withContainer(CoinTossBoard),
    meta: coinTossMeta,
  },
};

export const gameList = Object.values(games).map(({ meta }) => ({
  id: meta.id,
  title: meta.title,
}));
