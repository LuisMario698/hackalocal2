import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapHighlightProvider } from '../contexts/MapHighlightContext';
import { FontSizeProvider } from '../contexts/FontSizeContext';

function AIChatFAB() {
  const router = useRouter();
  const segments = useSegments();

  // Ocultar el FAB cuando ya estamos en el chat
  if (segments.includes('chat' as never)) return null;

  return (
    <Pressable
      style={styles.fab}
      onPress={() => router.push('/chat' as any)}
      accessibilityLabel="Abrir asistente IA"
      accessibilityRole="button"
    >
      <Ionicons name="chatbubble-ellipses" size={26} color="#FFF" />
    </Pressable>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
    <FontSizeProvider>
    <MapHighlightProvider>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="account" options={{ headerShown: false }} />
          <Stack.Screen
            name="chat"
            options={{
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
        <AIChatFAB />
        <StatusBar style="auto" />
      </View>
    </MapHighlightProvider>
    </FontSizeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
});