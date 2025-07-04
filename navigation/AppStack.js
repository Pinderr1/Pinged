// navigation/AppStack.js
import React, { lazy, Suspense } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Loader from "../components/Loader";
const MainTabs = lazy(() => import("./MainTabs"));
const ProfileScreen = lazy(() => import("../screens/ProfileScreen"));
const EditProfileScreen = lazy(() => import("../screens/EditProfileScreen"));
const ChatScreen = lazy(() => import("../screens/ChatScreen"));
const NotificationsScreen = lazy(() => import("../screens/NotificationsScreen"));
const GameInviteScreen = lazy(() => import("../screens/GameInviteScreen"));
const GameSessionScreen = lazy(() => import("../screens/GameSessionScreen"));
const GameWithBotScreen = lazy(() => import("../screens/GameWithBotScreen"));
const CommunityScreen = lazy(() => import("../screens/CommunityScreen"));
const PremiumScreen = lazy(() => import("../screens/PremiumScreen"));
const StatsScreen = lazy(() => import("../screens/StatsScreen"));
const PlayScreen = lazy(() => import("../screens/PlayScreen"));
const SwipeScreen = lazy(() => import("../screens/SwipeScreen"));
const LikedYouScreen = lazy(() => import("../screens/LikedYouScreen"));
const VerifyHumanScreen = lazy(() => import("../screens/VerifyHumanScreen"));
const PhoneVerificationScreen = lazy(() => import("../screens/PhoneVerificationScreen"));
const AdminReviewScreen = lazy(() => import("../screens/AdminReviewScreen"));
const DebugMenuScreen = lazy(() => import("../screens/DebugMenuScreen"));

const Stack = createNativeStackNavigator();

export default function AppStack() {
  return (
    <Suspense fallback={<Loader /> }>
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
      <Stack.Screen name="AdminReview" component={AdminReviewScreen} />
    </Stack.Navigator>
    </Suspense>
  );
}
