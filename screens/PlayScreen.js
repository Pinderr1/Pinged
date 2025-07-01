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
import { useDev } from '../contexts/DevContext';
import { useGameLimit } from '../contexts/GameLimitContext';
import { allGames } from '../data/games';
import GameCard from '../components/GameCard';
import GamePreviewModal from '../components/GamePreviewModal';
import GameFilters from '../components/GameFilters';
import useRequireGameCredits from '../hooks/useRequireGameCredits';
import * as Haptics from 'expo-haptics';
import PropTypes from 'prop-types';
import { useTrending } from '../contexts/TrendingContext';
import { HEADER_SPACING } from '../layout';


const getAllCategories = () => {
  const cats = [...new Set(allGames.map((g) => g.category))];
  return ['All', ...cats];
};

const PlayScreen = ({ navigation }) => {
  const { darkMode, theme } = useTheme();
  const styles = getGlobalStyles(theme);
  const { user } = useUser();
  const { devMode } = useDev();
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
    if (previewGame.premium && !isPremiumUser && !devMode) {
      navigation.navigate('Premium', { context: 'paywall' });
      return;
    }
    if (!requireCredits()) return;
    const { id, title, category, description } = previewGame;
    navigation.navigate('GameInvite', {
      game: { id, title, category, description }
    });
    // Game play is recorded in GameSessionScreen when the session starts
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

PlayScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

export default PlayScreen;
