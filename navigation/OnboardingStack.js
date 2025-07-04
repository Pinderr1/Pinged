// navigation/OnboardingStack.js
import React, { lazy, Suspense } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Loader from '../components/Loader';
const OnboardingScreen = lazy(() => import('../screens/OnboardingScreen'));

const Stack = createNativeStackNavigator();

export default function OnboardingStack() {
  return (
    <Suspense fallback={<Loader /> }>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
    </Suspense>
  );
}
