// navigation/OnboardingStack.js
import React, { lazy, Suspense, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import Loader from '../components/Loader';
const OnboardingScreen = lazy(() => import('../screens/OnboardingScreen'));
const PhoneVerificationScreen = lazy(() => import('../screens/PhoneVerificationScreen'));

const Stack = createNativeStackNavigator();

export default function OnboardingStack() {
  const { user } = useUser();
  const navigation = useNavigation();
  const showVerification = !user?.phoneVerified;

  useEffect(() => {
    navigation.reset({
      index: 0,
      routes: [
        { name: showVerification ? 'PhoneVerification' : 'Onboarding' },
      ],
    });
  }, [showVerification, navigation]);

  return (
    <Suspense fallback={<Loader />}>
      <Stack.Navigator
        initialRouteName={showVerification ? 'PhoneVerification' : 'Onboarding'}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      >
        {showVerification && (
          <Stack.Screen
            name="PhoneVerification"
            component={PhoneVerificationScreen}
          />
        )}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    </Suspense>
  );
}
