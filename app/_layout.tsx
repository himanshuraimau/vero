import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { initDatabase } from '@/app/db/schema';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initDatabase()
      .then(() => {
        if (!cancelled) setDbReady(true);
      })
      .catch((err) => {
        console.error('[Layout] DB init failed', err);
        if (!cancelled) setDbReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1c1917' },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="topic/[id]" />
        <Stack.Screen name="reader/[topicId]" />
        <Stack.Screen name="detail/[questionId]" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
