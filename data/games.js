import React from 'react';
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Entypo,
  Ionicons
} from '@expo/vector-icons';

export const allGames = [
  {
    id: '1',
    title: 'Tic Tac Toe',
    icon: <Entypo name="cross" size={30} />,
    route: 'TicTacToe',
    premium: false,
    category: 'Board',
    description: 'A classic 1v1 strategy game. Take turns placing Xs and Os.',
    mode: 'versus',
    speed: 'quick'
  },
  {
    id: '3',
    title: 'Rock Paper Scissors',
    icon: <MaterialCommunityIcons name="hand-peace" size={30} />,
    route: 'RockPaperScissors',
    premium: false,
    category: 'Quick',
    description: 'A quick reaction game. Co-op friendly. Tap fast to win!',
    mode: 'both',
    speed: 'quick'
  },
  {
    id: '4',
    title: 'Connect Four',
    icon: <MaterialCommunityIcons name="dots-grid" size={30} />,
    route: 'ConnectFour',
    premium: false,
    category: 'Board',
    description: 'Drop your discs into the grid. First to four in a row wins!',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '5',
    title: 'Checkers',
    icon: <MaterialCommunityIcons name="checkerboard" size={30} />,
    route: 'Checkers',
    premium: false,
    category: 'Board',
    description: 'Jump your opponent and crown your pieces in this strategic game.',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '6',
    title: 'Memory Match',
    icon: <MaterialCommunityIcons name="cards-outline" size={30} />,
    route: 'MemoryMatch',
    premium: false,
    category: 'Memory',
    description: 'Flip cards to find matches. Co-op or solo for fun brain training!',
    mode: 'co-op',
    speed: 'medium'
  },
  {
    id: '7',
    title: 'Hangman',
    icon: <MaterialCommunityIcons name="skull-outline" size={30} />,
    route: 'Hangman',
    premium: false,
    category: 'Word',
    description: 'Guess the word before the figure is drawn. Great for laughs and learning.',
    mode: 'both',
    speed: 'medium'
  },
  {
    id: '8',
    title: 'Dots and Boxes',
    icon: <FontAwesome5 name="braille" size={30} />,
    route: 'DotsAndBoxes',
    premium: false,
    category: 'Board',
    description: 'Connect dots to complete boxes. Strategic and competitive.',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '9',
    title: 'Gomoku',
    icon: <MaterialCommunityIcons name="grid-large" size={30} />,
    route: 'Gomoku',
    premium: false,
    category: 'Board',
    description: 'Five in a row wins. A deep strategy game similar to tic-tac-toe.',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '10',
    title: 'Mancala',
    icon: <MaterialCommunityIcons name="dots-circle" size={30} />,
    route: 'Mancala',
    premium: false,
    category: 'Board',
    description: 'Capture your opponent\u2019s pieces in this ancient strategy game.',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '12',
    title: 'Battleship',
    icon: <MaterialCommunityIcons name="ship-wheel" size={30} />,
    route: 'Battleship',
    premium: true,
    category: 'Strategy',
    description: 'Sink your opponent\u2019s fleet before they get yours.',
    mode: 'versus',
    speed: 'slow'
  },
  {
    id: '18',
    title: 'Blackjack',
    icon: <MaterialCommunityIcons name="cards-playing-outline" size={30} />,
    route: 'Blackjack',
    premium: true,
    category: 'Card',
    description: '21 or bust. Compete head-to-head or beat the house.',
    mode: 'both',
    speed: 'quick'
  },
  {
    id: '21',
    title: 'Sudoku',
    icon: <MaterialCommunityIcons name="table" size={30} />,
    route: 'Sudoku',
    premium: false,
    category: 'Puzzle',
    description: 'Fill the grid with numbers 1-9 without repeating in rows or columns.',
    mode: 'solo',
    speed: 'slow'
  },
  {
    id: '22',
    title: 'Minesweeper',
    icon: <MaterialCommunityIcons name="bomb" size={30} />,
    route: 'Minesweeper',
    premium: false,
    category: 'Puzzle',
    description: 'Clear the board without detonating a mine. Classic brain teaser.',
    mode: 'solo',
    speed: 'medium'
  },
  {
    id: '24',
    title: 'Dominoes',
    icon: <MaterialCommunityIcons name="dots-horizontal" size={30} />,
    route: 'Dominoes',
    premium: true,
    category: 'Board',
    description: 'Match tiles end to end. A timeless strategy game.',
    mode: 'versus',
    speed: 'slow'
  },
  {
    id: '32',
    title: 'Snakes & Ladders',
    icon: <MaterialCommunityIcons name="snake" size={30} />,
    route: 'SnakesLadders',
    premium: false,
    category: 'International',
    description: 'Climb up ladders and avoid snakes in this luck-based race.',
    mode: 'versus',
    speed: 'quick'
  },
  {
    id: '33',
    title: 'Guess Number',
    icon: <MaterialCommunityIcons name="numeric" size={30} />,
    route: 'GuessNumber',
    premium: false,
    category: 'Puzzle',
    description: 'Guess the secret number with hints each turn.',
    mode: 'solo',
    speed: 'quick'
  },
  {
    id: '34',
    title: 'Flirty Questions',
    icon: <MaterialCommunityIcons name="heart" size={30} />,
    route: 'flirtyQuestions',
    premium: false,
    category: 'Party',
    description: 'Take turns answering cute questions and spark conversation.',
    mode: 'co-op',
    speed: 'quick'
  },
  {
    id: '35',
    title: 'Coin Toss',
    icon: <MaterialCommunityIcons name="cash" size={30} />,
    route: 'CoinToss',
    premium: false,
    category: 'Quick',
    description: 'Pick heads or tails and test your luck.',
    mode: 'versus',
    speed: 'quick'
  },
  {
    id: '36',
    title: 'Nim',
    icon: <FontAwesome5 name="dice-d6" size={30} />,
    route: 'Nim',
    premium: false,
    category: 'Strategy',
    description: 'Take turns removing sticks. Avoid taking the last one.',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '37',
    title: 'Pig Dice',
    icon: <FontAwesome5 name="dice" size={30} />,
    route: 'PigDice',
    premium: false,
    category: 'Dice',
    description: 'Roll and hold to reach 100 points first.',
    mode: 'versus',
    speed: 'quick'
  }
];
