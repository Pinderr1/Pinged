// navigation/AppStack.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabs from "./MainTabs";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ChatScreen from "../screens/ChatScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import GameInviteScreen from "../screens/GameInviteScreen";
import GameSessionScreen from "../screens/GameSessionScreen";
import GameWithBotScreen from "../screens/GameWithBotScreen";
import CommunityScreen from "../screens/CommunityScreen";
import PremiumScreen from "../screens/PremiumScreen";
import StatsScreen from "../screens/StatsScreen";
import PlayScreen from "../screens/PlayScreen";
import SwipeScreen from "../screens/SwipeScreen";
import LikedYouScreen from "../screens/LikedYouScreen";
import VerifyHumanScreen from "../screens/VerifyHumanScreen";
import PhoneVerificationScreen from "../screens/PhoneVerificationScreen";
import DebugMenuScreen from "../screens/DebugMenuScreen";

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="GameInvite" component={GameInviteScreen} />
      <Stack.Screen
        name="GameSession"
        component={GameSessionScreen}
        options={{ animation: "fade_from_bottom" }}
      />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="EventChat" component={ChatScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen
        name="GameWithBot"
        component={GameWithBotScreen}
        options={{ animation: "fade_from_bottom" }}
      />
      <Stack.Screen name="LikedYou" component={LikedYouScreen} />
      <Stack.Screen name="Play" component={PlayScreen} />
      <Stack.Screen
        name="Swipe"
        component={SwipeScreen}
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="VerifyHuman" component={VerifyHumanScreen} />
      <Stack.Screen
        name="PhoneVerification"
        component={PhoneVerificationScreen}
      />
      <Stack.Screen name="DebugMenu" component={DebugMenuScreen} />
    </Stack.Navigator>
  );
}
