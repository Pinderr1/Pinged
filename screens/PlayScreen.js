import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  FlatList,
  View,
  Keyboard
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import SafeKeyboardView from '../components/SafeKeyboardView';
import getGlobalStyles from '../styles';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { allGames } from '../data/games';
import GameCard from '../components/GameCard';
import GamePreviewModal from '../components/GamePreviewModal';
import { games as gameRegistry } from '../games';
import { getRandomBot } from '../ai/bots';
import GameFilters from '../components/GameFilters';
import useRequireGameCredits from '../hooks/useRequireGameCredits';
import EmptyState from '../components/EmptyState';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';
import { useTrending } from '../contexts/TrendingContext';
import { HEADER_SPACING } from '../layout';

// Map app game IDs to boardgame registry keys for AI play
const aiGameMap = allGames.reduce((acc, g) => {
  const key = Object.keys(gameRegistry).find(
    (k) => gameRegistry[k].meta.title === g.title
  );
  if (key) acc[g.id] = key;
  return acc;
}, {});


const getAllCategories = () => {
  const cats = [...new Set(allGames.map((g) => g.category))];
  return ['All', ...cats];
};

const PlayScreen = ({ navigation }) => {
  const { darkMode, theme } = useTheme();
  const styles = getGlobalStyles(theme);
  const { user } = useUser();
  const { gamesLeft } = useGameLimit();
  const isPremiumUser = !!user?.isPremium;
  const requireCredits = useRequireGameCredits();
  const { trendingMap } = useTrending();
  const [filter, setFilter] = useState('All');
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [previewGame, setPreviewGame] = useState(null);
  const flatListRef = useRef();

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
    if (previewGame.premium && !isPremiumUser) {
      navigation.navigate('PremiumPaywall', { context: 'premium-feature' });
      return;
    }
    if (!requireCredits()) return;
    // Navigate to Matches screen to select an opponent for this game
    navigation.navigate('Matches');
    // Game play is recorded in GameSessionScreen when the session starts
  };

  const handlePracticeGame = () => {
    if (!previewGame) return;
    setPreviewGame(null);
    if (previewGame.premium && !isPremiumUser) {
      navigation.navigate('PremiumPaywall', { context: 'premium-feature' });
      return;
    }
    if (!requireCredits()) return;
    const bot = getRandomBot();
    const aiKeyMap = { rockPaperScissors: 'rps' };
    const key = aiGameMap[previewGame.id];
    const gameKey = key ? aiKeyMap[key] || key : 'ticTacToe';
    navigation.navigate('GameSession', {
      sessionType: 'bot',
      botId: bot.id,
      game: gameKey,
    });
  };

  const renderItem = ({ item }) => {
    const idx = allGames.findIndex((g) => g.id === item.id);
    return (
      <GameCard
        item={item}
        isFavorite={favorites.includes(item.id)}
        trending={!!trendingMap[item.id]}
        toggleFavorite={() => toggleFavorite(item.id)}
        onPress={() => {
          Keyboard.dismiss();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setPreviewGame(item);
        }}
      />
    );
  };

  return (
    <GradientBackground style={styles.swipeScreen}>
      <Header showLogoOnly />
      <SafeKeyboardView style={{ flex: 1, paddingTop: HEADER_SPACING }}>

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
        ListEmptyComponent={
          <EmptyState
            text="No games found."
            image={require('../assets/logo.png')}
          />
        }
      />

      <GamePreviewModal
        visible={!!previewGame}
        game={previewGame}
        onClose={() => setPreviewGame(null)}
        onPlayFriend={handleStartGame}
        onPracticeBot={handlePracticeGame}
      />
      </SafeKeyboardView>
    </GradientBackground>
  );
};

PlayScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default PlayScreen;
