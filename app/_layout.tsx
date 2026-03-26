import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { MapHighlightProvider } from '../contexts/MapHighlightContext';
import { FontSizeProvider } from '../contexts/FontSizeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';

export default function RootLayout() {
  return (
    <AuthProvider>
    <LanguageProvider>
    <FontSizeProvider>
    <MapHighlightProvider>
      <View style={{ flex: 1 }}>
        <Stack initialRouteName="index">
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="account" options={{ headerShown: false }} />
          <Stack.Screen name="verifier" options={{ headerShown: false }} />
          <Stack.Screen name="attend-report" options={{ headerShown: false }} />
          <Stack.Screen
            name="chat"
            options={{
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </MapHighlightProvider>
    </FontSizeProvider>
    </LanguageProvider>
    </AuthProvider>
  );
}