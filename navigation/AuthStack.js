// navigation/AuthStack.js
import React, { lazy, Suspense } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Loader from '../components/Loader';

const LoginScreen = lazy(() => import('../screens/auth/LoginScreen'));
const EmailAuthScreen = lazy(() => import('../screens/EmailAuthScreen'));

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Suspense fallback={<Loader />}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="EmailLogin"
          component={EmailAuthScreen}
          initialParams={{ mode: 'login' }}
        />
        <Stack.Screen
          name="Signup"
          component={EmailAuthScreen}
          initialParams={{ mode: 'signup' }}
        />
      </Stack.Navigator>
    </Suspense>
  );
}
