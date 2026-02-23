// App.js
// ============================================
// MAIN APP ENTRY POINT
// ============================================
// Handles auth state and shows correct navigator
// - If logged in: Show AppNavigator (tabs)
// - If logged out: Show AuthNavigator (login/signup)

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from './src/constants/colors';
import authService from './src/services/auth';

// Navigators
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  // ============================================
  // STATE
  // ============================================
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================
  // CHECK AUTH STATE ON APP START
  // ============================================
  useEffect(() => {
    // Get initial session
    authService.getSession().then((session) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup: unsubscribe when component unmounts
    return () => subscription.unsubscribe();
  }, []);

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.background 
      }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ============================================
  // RENDER CORRECT NAVIGATOR
  // ============================================
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {session ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}