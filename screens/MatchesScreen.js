import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import GradientBackground from '../components/GradientBackground';
import Header from '../components/Header';
import Card from '../components/Card';
import { useTheme } from '../contexts/ThemeContext';
import { useChats } from '../contexts/ChatContext';

const MatchesScreen = ({ navigation }) => {
  const { darkMode, theme } = useTheme();
  const { matches } = useChats();

  const newMatches = matches.filter((m) => (m.messages || []).length === 0);
  const activeChats = matches.filter((m) => (m.messages || []).length > 0);

  const renderNewMatch = ({ item }) => (
    <TouchableOpacity
      style={styles.newMatch}
      onPress={() => navigation.navigate('Chat', { user: item })}
    >
      <Image source={item.image} style={styles.newAvatar} />
      <Text style={[styles.newName, { color: theme.text }]} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderChat = ({ item }) => (
    <Card
      onPress={() => navigation.navigate('Chat', { user: item })}
      style={[styles.chatItem, { backgroundColor: theme.card }]}
    >
      <Image source={item.image} style={styles.chatAvatar} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.chatName, { color: theme.text }]}>{item.name}</Text>
        {item.messages?.length ? (
          <Text
            style={[styles.chatPreview, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.messages[item.messages.length - 1].text}
          </Text>
        ) : null}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GradientBackground style={{ flex: 1 }}>
        <Header />
        <View style={{ flex: 1, paddingTop: 80 }}>
          {newMatches.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>New Matches</Text>
              <FlatList
                data={newMatches}
                keyExtractor={(item) => item.id}
                renderItem={renderNewMatch}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.newList}
              />
            </>
          )}
          <Text style={styles.sectionTitle}>Active Chats</Text>
          <FlatList
            data={activeChats}
            keyExtractor={(item) => item.id}
            renderItem={renderChat}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </GradientBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#ff4081',
  },
  newList: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  newMatch: {
    alignItems: 'center',
    marginRight: 12,
  },
  newAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 6,
  },
  newName: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 72,
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
  },
  chatPreview: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default MatchesScreen;
