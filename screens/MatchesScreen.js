// /screens/MatchesScreen.js

import React, { useState } from 'react';
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
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useChats } from '../contexts/ChatContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const defaultGame = {
  id: 'tictactoe',
  title: 'Tic Tac Toe',
};
const MatchesScreen = ({ navigation }) => {
  const { darkMode } = useTheme();
  const { matches, removeMatch } = useChats();
  const [search, setSearch] = useState('');

  const filteredMatches = matches.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id) => {
    Alert.alert('Remove Match', 'Are you sure you want to remove this match?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeMatch(id),
      },
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
          <Text style={stylesLocal.screenTitle}>💖 Your Matches</Text>

          <View style={stylesLocal.searchBar}>
            <MaterialIcons name="search" size={20} color="#888" />
            <TextInput
              placeholder="Search matches..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              style={stylesLocal.searchInput}
            />
          </View>
          {filteredMatches.length === 0 ? (
            <Text style={stylesLocal.emptyText}>No matches found. Try swiping!</Text>
          ) : (
            <>
              <Text style={stylesLocal.sectionTitle}>🔥 New Matches</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={filteredMatches}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingLeft: 16 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={stylesLocal.newMatchCard}
                    onPress={() => navigation.navigate('Chat', { user: item })}
                  >
                    <Image source={item.image} style={stylesLocal.avatar} />
                    {item.online && <View style={stylesLocal.onlineDot} />}
                    <Text style={stylesLocal.name}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />

              <Text style={stylesLocal.sectionTitle}>💬 Active Chats</Text>
              {filteredMatches.map((item) => (
                <View key={item.id} style={stylesLocal.chatCard}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
                    onPress={() => navigation.navigate('Chat', { user: item })}
                    onLongPress={() => handleDelete(item.id)}
                  >
                    <Image source={item.image} style={stylesLocal.chatAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={stylesLocal.chatName}>
                        {item.name}, {item.age}
                      </Text>
                      <Text style={stylesLocal.chatBio} numberOfLines={1}>
                        {item.messages[item.messages.length - 1]?.text || 'No messages yet'}
                      </Text>
                      <Text style={stylesLocal.matchedAt}>{item.matchedAt}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('GameLobby', {
                        opponent: item,
                        game: defaultGame,
                        status: 'waiting',
                      })
                    }
                    style={stylesLocal.inviteBtn}
                  >
                    <Ionicons name="game-controller-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};
const stylesLocal = StyleSheet.create({
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 16,
    color: '#ff4081',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    marginVertical: 12,
    color: '#333',
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
    elevation: 1,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
    color: '#888',
  },
  newMatchCard: {
    marginRight: 16,
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#ff80ab',
  },
  name: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
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
    borderColor: '#fff',
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
    elevation: 2,
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  chatBio: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  matchedAt: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  inviteBtn: {
    marginLeft: 10,
    backgroundColor: '#ff4081',
    padding: 8,
    borderRadius: 8,
  },
});

export default MatchesScreen;
