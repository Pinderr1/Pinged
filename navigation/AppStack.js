// navigation/AppStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import GameInviteScreen from '../screens/GameInviteScreen';
import GameLobbyScreen from '../screens/GameLobbyScreen';
import CommunityScreen from '../screens/CommunityScreen';
import EventChatScreen from '../screens/EventChatScreen';
import PremiumScreen from '../screens/PremiumScreen';
import StatsScreen from '../screens/StatsScreen';
import GameWithBotScreen from '../screens/GameWithBotScreen';

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="GameInvite" component={GameInviteScreen} />
      <Stack.Screen name="GameLobby" component={GameLobbyScreen} />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="EventChat" component={EventChatScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="GameWithBot" component={GameWithBotScreen} />
    </Stack.Navigator>
  );
}
