import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MapHighlightProvider } from '../contexts/MapHighlightContext';

export default function RootLayout() {
  return (
    <MapHighlightProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </MapHighlightProvider>
  );
}