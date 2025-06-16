import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useTheme } from '../contexts/ThemeContext';
import { useChats } from '../contexts/ChatContext';

const MatchesScreen = ({ navigation }) => {
  const { darkMode } = useTheme();
  const { matches } = useChats();

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Chat', { user: item })}>
      <Image source={item.image} style={styles.avatar} />
      <Text style={styles.name}>
        {item.name}
        {item.isPremium && ' 💎'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={darkMode ? ['#444', '#222'] : ['#fff', '#ffe6f0']} style={{ flex: 1 }}>
        <Header />
        <Text style={styles.title}>Your Matches</Text>
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          horizontal={false}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 16,
    color: '#ff4081',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default MatchesScreen;
