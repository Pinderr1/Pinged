import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import styles from '../styles';
import { useTheme } from '../contexts/ThemeContext';

const features = [
  {
    icon: require('../assets/icons/unlimited.png'),
    text: 'Unlimited Game Invites'
  },
  {
    icon: require('../assets/icons/boost.png'),
    text: 'Priority Swipes & Boosts'
  },
  {
    icon: require('../assets/icons/games.png'),
    text: 'All 100+ Games Unlocked'
  },
  {
    icon: require('../assets/icons/heart.png'),
    text: 'See Who Liked You'
  }
];

const PremiumPaywallScreen = ({ navigation }) => {
  const { darkMode, theme } = useTheme();

  return (
    <LinearGradient
      colors={[theme.gradientStart, theme.gradientEnd]}
      style={{ flex: 1 }}
    >
      <Header />

      <View style={local.container}>
        <Text style={local.title}>Upgrade to Premium</Text>
        <Text style={local.subtitle}>More features. More matches. More fun.</Text>

        <FlatList
          data={features}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ marginTop: 24 }}
          renderItem={({ item }) => (
            <View style={local.featureRow}>
              <Image source={item.icon} style={local.icon} />
              <Text style={local.featureText}>{item.text}</Text>
            </View>
          )}
        />

        <TouchableOpacity style={local.upgradeBtn}>
          <Text style={local.upgradeText}>Upgrade Now</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={local.cancel}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const local = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d81b60'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center'
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  icon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginRight: 12
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1
  },
  upgradeBtn: {
    backgroundColor: '#d81b60',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 40,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5
  },
  upgradeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  cancel: {
    marginTop: 16,
    fontSize: 14,
    color: '#888'
  }
});

export default PremiumPaywallScreen;
