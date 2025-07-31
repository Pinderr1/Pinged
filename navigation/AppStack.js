// navigation/AppStack.js
import React, { lazy, Suspense, useState, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Loader from "../components/Loader";
import useRequireMatch from "../hooks/useRequireMatch";
const MainTabs = lazy(() => import("./MainTabs"));
const ProfileScreen = lazy(() => import("../screens/ProfileScreen"));
const EditProfileScreen = lazy(() => import("../screens/EditProfileScreen"));
const ChatScreen = lazy(() => import("../screens/ChatScreen"));
const NotificationsScreen = lazy(() => import("../screens/NotificationsScreen"));
const GameSessionScreen = lazy(() => import("../screens/GameSessionScreen"));
const CommunityScreen = lazy(() => import("../screens/CommunityScreen"));
const PremiumScreen = lazy(() => import("../screens/PremiumScreen"));
const PremiumPaywallScreen = lazy(() => import("../screens/PremiumPaywallScreen"));
const StatsScreen = lazy(() => import("../screens/StatsScreen"));
const BlockedUsersScreen = lazy(() => import("../screens/BlockedUsersScreen"));
const PlayScreen = lazy(() => import("../screens/PlayScreen"));
const SwipeScreen = lazy(() => import("../screens/SwipeScreen"));
const LikedYouScreen = lazy(() => import("../screens/LikedYouScreen"));
const PhoneVerificationScreen = lazy(() => import("../screens/PhoneVerificationScreen"));
const AdminReviewScreen = lazy(() => import("../screens/AdminReviewScreen"));

const Stack = createNativeStackNavigator();

function GuardedChatScreen(props) {
  const requireMatch = useRequireMatch();
  const { route } = props;
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const uid = route.params?.user?.id || route.params?.chatId;
    if (!uid) {
      setChecked(true);
      return;
    }
    requireMatch(uid).then(setChecked);
  }, [route.params]);
  if (!checked) return <Loader />;
  return <ChatScreen {...props} />;
}

function GuardedGameSessionScreen(props) {
  const requireMatch = useRequireMatch();
  const { route } = props;
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const opponent = route.params?.opponent?.id || route.params?.opponentId;
    const type = route.params?.sessionType || (route.params?.botId ? 'bot' : 'live');
    if (!opponent || type !== 'live') {
      setChecked(true);
      return;
    }
    requireMatch(opponent).then(setChecked);
  }, [route.params]);
  if (!checked) return <Loader />;
  return <GameSessionScreen {...props} />;
}

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
      <Stack.Screen name="Chat" component={GuardedChatScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen
        name="GameSession"
        component={GuardedGameSessionScreen}
        options={{ animation: "fade_from_bottom" }}
      />
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="PremiumPaywall" component={PremiumPaywallScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      <Stack.Screen name="LikedYou" component={LikedYouScreen} />
      <Stack.Screen name="Play" component={PlayScreen} />
      <Stack.Screen
        name="Swipe"
        component={SwipeScreen}
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="PhoneVerification"
        component={PhoneVerificationScreen}
      />
      <Stack.Screen name="AdminReview" component={AdminReviewScreen} />
    </Stack.Navigator>
    </Suspense>
  );
}
