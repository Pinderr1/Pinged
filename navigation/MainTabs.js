// navigation/MainTabs.js
import React, { lazy, Suspense } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Ionicons,
  FontAwesome5,
  FontAwesome,
} from '@expo/vector-icons';

import { useTheme } from '../contexts/ThemeContext';
import Loader from '../components/Loader';

const HomeScreen = lazy(() => import('../screens/HomeScreen'));
const SwipeScreen = lazy(() => import('../screens/SwipeScreen'));
const MatchesScreen = lazy(() => import('../screens/MatchesScreen'));
const SettingsScreen = lazy(() => import('../screens/SettingsScreen'));

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { theme } = useTheme();

  return (
    <Suspense fallback={<Loader />}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: theme.gradientStart,
          tabBarInactiveTintColor: '#888',
          tabBarLabelStyle: { fontSize: 12, paddingBottom: 2 },
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopWidth: 1,
            borderColor: '#eee',
            height: 60,
            paddingTop: 5,
          },
          tabBarIcon: ({ color }) => {
            const size = 22;
            const icons = {
              Home: (
                <Ionicons name="home-outline" color={color} size={size} />
              ),
              Explore: <FontAwesome5 name="fire" color={color} size={20} />,
              Matches: (
                <Ionicons
                  name="chatbubble-ellipses"
                  color={color}
                  size={size}
                />
              ),
              Settings: (
                <Ionicons name="settings-outline" color={color} size={20} />
              ),
            };
            return (
              icons[route.name] || (
                <FontAwesome name="circle" color={color} size={20} />
              )
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Explore" component={SwipeScreen} />
        <Tab.Screen name="Matches" component={MatchesScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </Suspense>
  );
}
