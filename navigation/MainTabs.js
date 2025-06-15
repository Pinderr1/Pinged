// navigation/MainTabs.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome,
} from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import SwipeScreen from '../screens/SwipeScreen';
import MatchesScreen from '../screens/MatchesScreen';
import PlayScreen from '../screens/PlayScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { darkMode } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF75B5',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: 12, paddingBottom: 2 },
        tabBarStyle: {
          backgroundColor: darkMode ? '#444' : '#fff',
          borderTopWidth: 1,
          borderColor: '#eee',
          height: 60,
          paddingTop: 5,
        },
        tabBarIcon: ({ color }) => {
          const size = 22;
          const icons = {
            Home: <Ionicons name="home-outline" color={color} size={size} />,
            Explore: <FontAwesome5 name="fire" color={color} size={20} />,
            Matches: <Ionicons name="chatbubble-ellipses" color={color} size={size} />,
            Play: <MaterialCommunityIcons name="controller-classic" color={color} size={size} />,
            Settings: <Ionicons name="settings-outline" color={color} size={20} />,
          };
          return icons[route.name] || <FontAwesome name="circle" color={color} size={20} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={SwipeScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Play" component={PlayScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
