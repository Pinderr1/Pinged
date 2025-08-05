import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useUser } from "./contexts/UserContext";
import StreakRewardModal from "./components/StreakRewardModal";
import Providers from "./contexts/Providers";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationCenter from "./components/NotificationCenter";
import LoadingOverlay from "./components/LoadingOverlay";
import Toast from "react-native-toast-message";
import * as Analytics from "./utils/analytics";
import usePushNotifications from "./hooks/usePushNotifications";
import useRemoteConfig from "./hooks/useRemoteConfig";
import RootNavigator from "./navigation/RootNavigator";
import { useTheme } from "./contexts/ThemeContext";
import initErrorHandling from "./initErrorHandling";

const linking = {
  prefixes: ['https://pinged.app', 'pinged://'],
  config: {
    screens: {
      HomeScreen: 'home',
      MatchScreen: 'match/:id',
    },
  },
};

// Initialize global error handling once at startup
initErrorHandling();

const ThemedNotificationCenter = () => {
  const { theme } = useTheme();
  return <NotificationCenter color={theme.accent} />;
};

const AppInner = () => {
  usePushNotifications();
  // No custom fonts currently loaded
  const [fontsLoaded] = useFonts({});
  const { loaded: themeLoaded } = useTheme();
  const {
    user,
    loading: userLoading,
    streakReward,
    dismissStreakReward,
  } = useUser();
  const {
    loading: configLoading,
    error: configError,
    alertMessage,
  } = useRemoteConfig();

  useEffect(() => {
    const ensureMediaPermissions = async () => {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Photo Access",
          "Pinged uses your photo library so you can upload and share photos. Please allow access on the next screen.",
          [
            {
              text: "Continue",
              onPress: async () => {
                await ImagePicker.requestMediaLibraryPermissionsAsync();
              },
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
      }
    };
    ensureMediaPermissions();
  }, []);

  useEffect(() => {
    if (alertMessage) {
      Toast.show({ type: "info", text1: alertMessage });
    }
  }, [alertMessage]);

  useEffect(() => {
    if (fontsLoaded && themeLoaded && !userLoading && !configLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, themeLoaded, userLoading, configLoading]);

  useEffect(() => {
    if (user?.uid) {
      Analytics.setUserId(user.uid).catch(() => {});
    }
  }, [user?.uid]);

  if (!fontsLoaded || !themeLoaded || userLoading || configLoading) {
    return null;
  }

  if (configError) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Failed to load configuration.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={60}
      >
        <ErrorBoundary>
          <NavigationContainer linking={linking}>
            <RootNavigator />
          </NavigationContainer>
          <ThemedNotificationCenter />
          <StreakRewardModal
            visible={!!streakReward}
            streak={streakReward}
            onClose={dismissStreakReward}
          />
          <LoadingOverlay />
          <Toast />
        </ErrorBoundary>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <Providers>
      <AppInner />
    </Providers>
  );
}
