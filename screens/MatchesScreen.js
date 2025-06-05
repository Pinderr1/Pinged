// /screens/MatchesScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from '../styles';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const initialMockMatches = [
  {
    id: '1',
    name: 'Emily',
    age: 25,
    image: require('../assets/user1.jpg'),
    online: true,
    lastMessage: 'Haha ok let’s play later 😄',
    matchedAt: '2 days ago'
  },
  {
    id: '2',
    name: 'Liam',
    age: 27,
    image: require('../assets/user2.jpg'),
    online: false,
    lastMessage: 'Yo! Wanna do a rematch?',
    matchedAt: '1 day ago'
  },
  {
    id: '3',
    name: 'Ava',
    age: 23,
    image: require('../assets/user1.jpg'),
    online: true,
    lastMessage: 'BRB! Gotta grab coffee ☕',
    matchedAt: '5 hours ago'
  }
];

const MatchesScreen = ({ navigation }) => {
  const { darkMode } = useTheme();
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultGame = {
    id: 'tictactoe',
    title: 'Tic Tac Toe'
  };

  useEffect(() => {
    // Fake loading simulation for now
    setTimeout(() => {
      setMatches(initialMockMatches);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredMatches = matches.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id) => {
    Alert.alert('Remove Match', 'Are you sure you want to remove this match?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setMatches(matches.filter((m) => m.id !== id))
      }
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={darkMode ? ['#121212', '#1e1e1e'] : ['#fff', '#ffe6f0']}
        style={{ flex: 1 }}
      >
        <Header />

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <Text style={matchStyles.screenTitle}>💖 Your Matches</Text>

          {/* Search Bar */}
          <View style={matchStyles.searchBar}>
            <MaterialIcons name="search" size={20} color="#888" />
            <TextInput
              placeholder="Search matches..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              style={matchStyles.searchInput}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#ff4081" style={{ marginTop: 50 }} />
          ) : filteredMatches.length === 0 ? (
            <Text style={matchStyles.emptyText}>No matches found. Try swiping!</Text>
          ) : (
            <>
              {/* New Matches */}
              <Text style={matchStyles.sectionTitle}>🔥 New Matches</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={filteredMatches}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingLeft: 16 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={matchStyles.newMatchCard}
                    onPress={() => navigation.navigate('Chat', { user: item })}
                  >
                    <Image source={item.image} style={matchStyles.avatar} />
                    {item.online && <View style={matchStyles.onlineDot} />}
                    <Text style={matchStyles.name}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />

              {/* Active Chats */}
              <Text style={matchStyles.sectionTitle}>💬 Active Chats</Text>
              {filteredMatches.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onLongPress={() => handleDelete(item.id)}
                  style={matchStyles.chatCard}
                >
                  <Image source={item.image} style={matchStyles.chatAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={matchStyles.chatName}>
                      {item.name}, {item.age}
                    </Text>
                    <Text style={matchStyles.chatBio} numberOfLines={1}>
                      {item.lastMessage}
                    </Text>
                    <Text style={matchStyles.matchedAt}>{item.matchedAt}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('GameLobby', {
                        opponent: item,
                        game: defaultGame,
                        status: 'waiting'
                      })
                    }
                    style={matchStyles.inviteBtn}
                  >
                    <Ionicons name="game-controller-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const matchStyles = StyleSheet.create({
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 16,
    color: '#ff4081'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    marginVertical: 12,
    color: '#333'
  },
  searchBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
    color: '#888'
  },
  newMatchCard: {
    marginRight: 16,
    alignItems: 'center',
    position: 'relative'
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#ff80ab'
  },
  name: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600'
  },
  onlineDot: {
    width: 12,
    height: 12,
    backgroundColor: 'limegreen',
    borderRadius: 6,
    position: 'absolute',
    right: 2,
    top: 2,
    borderWidth: 1.5,
    borderColor: '#fff'
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333'
  },
  chatBio: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
  },
  matchedAt: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2
  },
  inviteBtn: {
    marginLeft: 10,
    backgroundColor: '#ff4081',
    padding: 8,
    borderRadius: 8
  }
});

export default MatchesScreen;
