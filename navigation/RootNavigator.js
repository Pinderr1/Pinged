// navigation/RootNavigator.js
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';
import * as Linking from 'expo-linking';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import EmailLoginScreen from '../screens/EmailLoginScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MainTabs from './MainTabs';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import GameInviteScreen from '../screens/GameInviteScreen';
import GameLobbyScreen from '../screens/GameLobbyScreen';
import CommunityScreen from '../screens/CommunityScreen';
import EventChatScreen from '../screens/EventChatScreen';
import PremiumScreen from '../screens/PremiumScreen';
import PremiumPaywallScreen from '../screens/PremiumPaywallScreen';
import StatsScreen from '../screens/StatsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';



const Stack = createNativeStackNavigator();
const splashDuration = 2000;

export default function RootNavigator() {
  const [isSplash, setIsSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsSplash(false), splashDuration);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      const parsed = Linking.parse(url);
      if (parsed.path === 'chat') {
        console.log('Deep linking to Chat');
      }
    };
    Linking.addEventListener('url', handleDeepLink);
    return () => Linking.removeAllListeners('url');
  }, []);

  if (isSplash) return <SplashScreen onFinish={() => setIsSplash(false)} />;

  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="GameInvite" component={GameInviteScreen} />
      <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="EventChat" component={EventChatScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="PremiumPaywall" component={PremiumPaywallScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

    </Stack.Navigator>
  );
}
