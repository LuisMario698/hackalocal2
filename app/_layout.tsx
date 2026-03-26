import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MapHighlightProvider } from '../contexts/MapHighlightContext';
import { FontSizeProvider } from '../contexts/FontSizeContext';

export default function RootLayout() {
  return (
    <FontSizeProvider>
    <MapHighlightProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </MapHighlightProvider>
    </FontSizeProvider>
  );
}