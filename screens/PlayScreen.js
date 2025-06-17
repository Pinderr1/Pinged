import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  FlatList,
  TouchableOpacity,
  View,
  Dimensions,
  TextInput,
  Animated,
  Keyboard,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styles from '../styles';
import Header from '../components/Header';
import {
  MaterialCommunityIcons,
  FontAwesome5,
  Entypo,
  Ionicons
} from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useDev } from '../contexts/DevContext';
import { useGameLimit } from '../contexts/GameLimitContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

const allGames = [
  {
    id: '1',
    title: 'Tic Tac Toe',
    icon: <Entypo name="cross" size={32} />,
    route: 'TicTacToe',
    premium: false,
    category: 'Board',
    description: 'A classic 1v1 strategy game. Take turns placing Xs and Os.',
    mode: 'versus',
    speed: 'quick'
  },
  {
    id: '2',
    title: 'Chess',
    icon: <FontAwesome5 name="chess-knight" size={30} />,
    route: null,
    premium: false,
    category: 'Board',
    description: 'Outsmart your opponent in this strategic classic.',
    mode: 'versus',
    speed: 'slow'
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
    route: null,
    premium: false,
    category: 'Board',
    description: 'Jump your opponent and crown your pieces in this strategic game.',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '6',
    title: 'Memory Match',
    icon: <Ionicons name="images-outline" size={30} />,
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
    icon: <MaterialCommunityIcons name="human-male-female" size={30} />,
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
    icon: <FontAwesome5 name="braille" size={28} />,
    route: null,
    premium: false,
    category: 'Board',
    description: 'Connect dots to complete boxes. Strategic and competitive.',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '9',
    title: 'Gomoku',
    icon: <MaterialCommunityIcons name="grid-large" size={28} />,
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
    icon: <MaterialCommunityIcons name="dots-circle" size={28} />,
    route: null,
    premium: false,
    category: 'Board',
    description: 'Capture your opponent’s pieces in this ancient strategy game.',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '11',
    title: 'Uno',
    icon: <MaterialCommunityIcons name="cards" size={30} />,
    route: null,
    premium: true,
    category: 'Card',
    description: 'Match colors and numbers to shed your hand first. Fast and fun.',
    mode: 'both',
    speed: 'quick'
  },
  {
    id: '12',
    title: 'Battleship',
    icon: <MaterialCommunityIcons name="ship-wheel" size={30} />,
    route: null,
    premium: true,
    category: 'Strategy',
    description: 'Sink your opponent’s fleet before they get yours.',
    mode: 'versus',
    speed: 'slow'
  },
  {
    id: '13',
    title: '4-in-a-Row Advanced',
    icon: <MaterialCommunityIcons name="dots-grid" size={30} />,
    route: null,
    premium: true,
    category: 'Board',
    description: 'Same as Connect Four, but with twists and traps!',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '14',
    title: 'Reversi',
    icon: <MaterialCommunityIcons name="swap-horizontal" size={30} />,
    route: null,
    premium: true,
    category: 'Board',
    description: 'Flip your opponent’s pieces in this classic territory control game.',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '15',
    title: 'Speed Card Game',
    icon: <MaterialCommunityIcons name="timer-outline" size={30} />,
    route: null,
    premium: true,
    category: 'Card',
    description: 'Play cards fast to win. Speed and reflexes win here!',
    mode: 'versus',
    speed: 'quick'
  },
  {
    id: '16',
    title: 'Word Duel',
    icon: <MaterialCommunityIcons name="alphabetical" size={30} />,
    route: null,
    premium: true,
    category: 'Word',
    description: 'Form words faster than your opponent. Vocabulary meets battle!',
    mode: 'versus',
    speed: 'medium'
  },
  {
    id: '17',
    title: 'Pictionary',
    icon: <MaterialCommunityIcons name="palette" size={30} />,
    route: null,
    premium: true,
    category: 'Drawing',
    description: 'Draw a word, your partner guesses it. A hilarious co-op drawing game!',
    mode: 'co-op',
    speed: 'medium'
  },
  {
    id: '18',
    title: 'Blackjack',
    icon: <MaterialCommunityIcons name="cards-playing-outline" size={30} />,
    route: null,
    premium: true,
    category: 'Card',
    description: '21 or bust. Compete head-to-head or beat the house.',
    mode: 'both',
    speed: 'quick'
  },
  {
    id: '19',
    title: 'Poker Duel',
    icon: <MaterialCommunityIcons name="cards-outline" size={30} />,
    route: null,
    premium: true,
    category: 'Card',
    description: 'Heads-up poker duel. Bluff, bet, and dominate.',
    mode: 'versus',
    speed: 'slow'
  },
  {
    id: '20',
    title: 'Truth or Dare',
    icon: <MaterialCommunityIcons name="emoticon-wink-outline" size={30} />,
    route: null,
    premium: true,
    category: 'Party',
    description: 'The ultimate social icebreaker. Play spicy or silly.',
    mode: 'co-op',
    speed: 'medium'
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
    id: '23',
    title: 'Word Search',
    icon: <Ionicons name="search" size={30} />,
    route: null,
    premium: false,
    category: 'Word',
    description: 'Find hidden words in the letter grid as fast as you can.',
    mode: 'solo',
    speed: 'quick'
  },
  {
    id: '24',
    title: 'Dominoes',
    icon: <MaterialCommunityIcons name="dice-multiple" size={30} />,
    route: null,
    premium: true,
    category: 'Board',
    description: 'Match tiles end to end. A timeless strategy game.',
    mode: 'versus',
    speed: 'slow'
  },
  {
    id: '25',
    title: 'Mahjong',
    icon: <MaterialCommunityIcons name="mahjong" size={30} />,
    route: null,
    premium: true,
    category: 'International',
    description: 'Tile-matching challenge from China. Clear the board to win.',
    mode: 'versus',
    speed: 'slow',
    international: true
  },
  {
    id: '26',
    title: 'Go',
    icon: <FontAwesome5 name="circle" size={30} />,
    route: null,
    premium: true,
    category: 'International',
    description: 'Ancient territory game. Surround more area than your opponent.',
    mode: 'versus',
    speed: 'slow',
    international: true
  },
  {
    id: '27',
    title: 'Xiangqi',
    icon: <FontAwesome5 name="chess" size={30} />,
    route: null,
    premium: true,
    category: 'International',
    description: 'Chinese chess. Outsmart your rival on the river board.',
    mode: 'versus',
    speed: 'slow',
    international: true
  },
  {
    id: '28',
    title: 'Shogi',
    icon: <FontAwesome5 name="chess-bishop" size={30} />,
    route: null,
    premium: true,
    category: 'International',
    description: 'Japanese chess with piece promotion and drops.',
    mode: 'versus',
    speed: 'slow',
    international: true
  },
  {
    id: '29',
    title: 'Ludo',
    icon: <MaterialCommunityIcons name="dice-4" size={30} />,
    route: null,
    premium: false,
    category: 'International',
    description: 'Race your tokens around the board. Family favourite worldwide.',
    mode: 'versus',
    speed: 'medium',
    international: true
  },
  {
    id: '30',
    title: 'Carrom',
    icon: <MaterialCommunityIcons name="circle-slice-8" size={30} />,
    route: null,
    premium: false,
    category: 'International',
    description: 'Flick discs into pockets in this popular Asian table game.',
    mode: 'versus',
    speed: 'medium',
    international: true
  },
  {
    id: '31',
    title: 'Backgammon',
    icon: <FontAwesome5 name="dice-d20" size={30} />,
    route: null,
    premium: true,
    category: 'International',
    description: 'Move your checkers off the board before your opponent does.',
    mode: 'versus',
    speed: 'slow',
    international: true
  },
  {
    id: '32',
    title: 'Snakes & Ladders',
    icon: <MaterialCommunityIcons name="stairs" size={30} />,
    route: null,
    premium: false,
    category: 'International',
    description: 'Climb up ladders and avoid snakes in this luck-based race.',
    mode: 'versus',
    speed: 'quick',
    international: true
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
  }
];

const getAllCategories = () => {
  const cats = [...new Set(allGames.map((g) => g.category))];
  return ['All', ...cats];
};

const PlayScreen = ({ navigation }) => {
  const { darkMode } = useTheme();
  const gradientColors = darkMode ? ['#444', '#222'] : ['#FF75B5', '#FF9A75'];
  const { user } = useUser();
  const { devMode } = useDev();
  const { gamesLeft, recordGamePlayed } = useGameLimit();
  const isPremiumUser = !!user?.isPremium;
  const [filter, setFilter] = useState('All');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [previewGame, setPreviewGame] = useState(null);
  const flatListRef = useRef();
  const animatedScales = useRef(allGames.map(() => new Animated.Value(1))).current;

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const filteredGames = allGames.filter((game) => {
    const matchCategory =
      filter === 'All' ||
      (filter === 'Free' && !game.premium) ||
      (filter === 'Premium' && game.premium) ||
      (filter === 'Favorites' && favorites.includes(game.id));
    const matchSearch = game.title.toLowerCase().includes(search.toLowerCase());
    const matchTag = category === 'All' || game.category === category;
    return matchCategory && matchSearch && matchTag;
  });


  useEffect(() => {
    if (filter === 'Premium') {
      const firstPremiumIndex = filteredGames.findIndex((g) => g.premium);
      if (firstPremiumIndex >= 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: firstPremiumIndex, animated: true });
        }, 200);
      }
    }
  }, [filter]);

  const renderItem = ({ item }) => {
    const idx = allGames.findIndex((g) => g.id === item.id);
    return (
      <Animated.View style={{ transform: [{ scale: animatedScales[idx] }] }}>
      <TouchableOpacity
        style={{
          width: CARD_WIDTH,
          marginHorizontal: 8,
          marginBottom: 20,
          backgroundColor: '#fff',
          borderRadius: 16,
          paddingVertical: 20,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 6,
          elevation: 4,
          position: 'relative'
        }}
        onPressIn={() =>
          Animated.spring(animatedScales[idx], {
            toValue: 0.96,
            useNativeDriver: true
          }).start()
        }
        onPressOut={() =>
          Animated.spring(animatedScales[idx], {
            toValue: 1,
            friction: 3,
            useNativeDriver: true
          }).start()
        }
        onPress={() => {
          Keyboard.dismiss();
          setPreviewGame(item);
        }}
      >
        <TouchableOpacity
          onPress={() => toggleFavorite(item.id)}
          style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}
        >
          <Ionicons
            name={favorites.includes(item.id) ? 'star' : 'star-outline'}
            size={18}
            color={favorites.includes(item.id) ? '#facc15' : '#ccc'}
          />
        </TouchableOpacity>

        {!item.route && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: item.premium ? '#d81b60' : '#aaa',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 8
            }}
          >
            <Text style={{ color: '#fff', fontSize: 10 }}>
              {item.premium ? 'Premium' : 'Coming Soon'}
            </Text>
          </View>
        )}

        {item.premium && (
          <Ionicons
            name="lock-closed"
            size={18}
            color="#d81b60"
            style={{ position: 'absolute', bottom: 8, right: 8 }}
          />
        )}

        <View style={{ marginBottom: 10 }}>{item.icon}</View>
        <Text style={{ fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          {item.category}
        </Text>
      </TouchableOpacity>
    </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.swipeScreen}
    >
      <Header showLogoOnly />

      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          textAlign: 'center',
          marginTop: 40,
          marginBottom: 6
        }}
      >
        Break the ice with games
      </Text>

      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 6,
          backgroundColor: '#fff',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 4,
          elevation: 2
        }}
      >
        <TextInput
          placeholder="Search games..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={{ fontSize: 14, color: '#000', paddingVertical: 3 }}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginBottom: 6
        }}
      >
        {['All', 'Free', 'Premium', 'Favorites'].map((label) => (
          <TouchableOpacity
            key={label}
            onPress={() => {
              setFilter(label);
              Keyboard.dismiss();
            }}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 16,
              backgroundColor: filter === label ? '#d81b60' : '#eee',
              marginHorizontal: 3
            }}
          >
            <Text
              style={{
                color: filter === label ? '#fff' : '#444',
                fontWeight: '600',
                fontSize: 12
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: 6
        }}
      >
        {getAllCategories().map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setCategory(cat)}
            style={{
              paddingVertical: 3,
              paddingHorizontal: 8,
              borderRadius: 16,
              backgroundColor: category === cat ? '#ff80ab' : '#eee',
              margin: 2
            }}
          >
            <Text
              style={{
                color: category === cat ? '#fff' : '#444',
                fontSize: 11
              }}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>



      <FlatList
        ref={flatListRef}
        data={filteredGames}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 8 }}
        columnWrapperStyle={{ justifyContent: 'center' }}
        renderItem={renderItem}
        onScrollBeginDrag={Keyboard.dismiss}
      />

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!previewGame}
        onRequestClose={() => setPreviewGame(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'flex-end'
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              paddingBottom: 40
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
              {previewGame?.title}
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              {previewGame?.description}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
              <Text style={{ backgroundColor: '#eee', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8, fontSize: 12 }}>
                {previewGame?.category}
              </Text>
              {previewGame?.mode && (
                <Text style={{ backgroundColor: '#d1fae5', color: '#065f46', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8, fontSize: 12 }}>
                  {previewGame?.mode === 'both' ? 'Co-op or Versus' : previewGame.mode}
                </Text>
              )}
              {previewGame?.speed && (
                <Text style={{ backgroundColor: '#fef9c3', color: '#92400e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12 }}>
                  {previewGame.speed}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={{ backgroundColor: previewGame?.route ? '#d81b60' : '#ccc', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
              disabled={!previewGame?.route}
              onPress={() => {
                setPreviewGame(null);
                if (previewGame?.premium && !isPremiumUser && !devMode) {
                  navigation.navigate('PremiumPaywall');
                  return;
                }
              if (!isPremiumUser && gamesLeft <= 0 && !devMode) {
              navigation.navigate('PremiumPaywall');
              return;
                }
                const { id, title, category, description } = previewGame;
                navigation.navigate('GameInvite', {
                  game: { id, title, category, description }
                });
                recordGamePlayed();
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                {previewGame?.route ? 'Start Game' : 'Coming Soon'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPreviewGame(null)} style={{ marginTop: 12 }}>
              <Text style={{ textAlign: 'center', color: '#888' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default PlayScreen;
