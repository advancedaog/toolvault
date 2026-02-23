import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { User } from './src/types';
import { colors } from './src/theme';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <LoginScreen onLogin={(u) => setUser(u)} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator user={user} onLogout={() => setUser(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
