import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  FlatList,
  TouchableOpacity,
  View,
  Dimensions,
  TextInput,
  Animated,
  Keyboard
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import SafeKeyboardView from '../components/SafeKeyboardView';
import styles from '../styles';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useDev } from '../contexts/DevContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { allGames } from '../data/games';
import GameCard from '../components/GameCard';
import GamePreviewModal from '../components/GamePreviewModal';
import GameFilters from '../components/GameFilters';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.42;


const getAllCategories = () => {
  const cats = [...new Set(allGames.map((g) => g.category))];
  return ['All', ...cats];
};

const PlayScreen = ({ navigation }) => {
  const { darkMode, theme } = useTheme();
  const gradientColors = [theme.gradientStart, theme.gradientEnd];
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

  const handleStartGame = () => {
    if (!previewGame) return;
    setPreviewGame(null);
    if (previewGame.premium && !isPremiumUser && !devMode) {
      navigation.navigate('Premium', { context: 'paywall' });
      return;
    }
    if (!isPremiumUser && gamesLeft <= 0 && !devMode) {
      navigation.navigate('Premium', { context: 'paywall' });
      return;
    }
    const { id, title, category, description } = previewGame;
    navigation.navigate('GameInvite', {
      game: { id, title, category, description }
    });
    recordGamePlayed();
  };

  const renderItem = ({ item }) => {
    const idx = allGames.findIndex((g) => g.id === item.id);
    return (
      <GameCard
        item={item}
        scale={animatedScales[idx]}
        isFavorite={favorites.includes(item.id)}
        toggleFavorite={() => toggleFavorite(item.id)}
        onPress={() => {
          Keyboard.dismiss();
          setPreviewGame(item);
        }}
      />
    );
  };

  return (
    <GradientBackground colors={gradientColors} style={styles.swipeScreen}>
      <Header showLogoOnly />
      <SafeKeyboardView style={{ flex: 1 }}>

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

      <GameFilters
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        category={category}
        setCategory={setCategory}
        categories={getAllCategories()}
      />



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

      <GamePreviewModal
        visible={!!previewGame}
        game={previewGame}
        onClose={() => setPreviewGame(null)}
        onStart={handleStartGame}
      />
      </SafeKeyboardView>
    </GradientBackground>
  );
};

export default PlayScreen;
