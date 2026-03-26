import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Text from '../../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatBubble from '../../components/chat/ChatBubble';
import TypingIndicator from '../../components/chat/TypingIndicator';
import { ChatMessage, useChat } from '../../hooks/useChat';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';

const SUGGESTIONS = [
  {
    category: 'Eco-puntos y nivel',
    items: [
      '¿Cuántos eco-puntos tengo?',
      '¿En qué nivel estoy?',
      '¿Cuántos puntos me faltan para subir de nivel?',
    ],
  },
  {
    category: 'Reportes',
    items: [
      'Quiero reportar basura en...',
      '¿Cómo van mis reportes?',
      'Mostrar mis últimos reportes',
    ],
  },
  {
    category: 'Recompensas y servicios',
    items: [
      '¿Qué recompensas puedo canjear?',
      '¿Hay servicios comunitarios disponibles?',
      'Quiero participar en una limpieza',
    ],
  },
  {
    category: 'Notificaciones',
    items: ['¿Tengo notificaciones nuevas?', '¿Qué pasó con mi reporte?'],
  },
];

export default function ChatTabScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const recordingScale = useRef(new Animated.Value(1)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { user, profile } = useAuth();

  // STT con OpenAI Whisper (Edge Function con API key en Supabase)
  const {
    transcript,
    isRecording,
    isLoading: isSttLoading,
    startRecording,
    stopRecording,
    error: sttError,
  } = useSpeechRecognition({ language: 'es' });

  const { messages, isLoading, sendMessage, resetChat } = useChat({
    userId: user?.id ?? '',
    userRole: (profile?.role as 'client' | 'association' | 'admin') ?? 'client',
  });

  // Actualizar input cuando termina el STT
  React.useEffect(() => {
    if (transcript && !isRecording) {
      setInputText((prev) => prev + (prev ? ' ' : '') + transcript);
    }
  }, [transcript, isRecording]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const toggleMicrophone = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      // Animar inicio de grabación
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingScale, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(recordingScale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      await startRecording();
    }
  };

  // Resetear escala cuando se detiene grabación
  React.useEffect(() => {
    if (!isRecording) {
      recordingScale.setValue(1);
    }
  }, [isRecording]);

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <ChatBubble role={item.role} content={item.content} imageUrl={item.image_url} />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Ionicons name="sparkles" size={20} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Asistente IA</Text>
            <Text style={styles.headerSub}>En línea</Text>
          </View>
        </View>
        <Pressable onPress={resetChat} style={styles.resetBtn}>
          <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Hola, soy tu asistente</Text>
            <Text style={styles.emptyText}>
              Puedo ayudarte a crear reportes, consultar tus puntos, ver recompensas y mucho más.
              ¡Pregúntame lo que necesites!
            </Text>
            <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
              {SUGGESTIONS.map((section) => (
                <View key={section.category} style={styles.suggestionSection}>
                  <Text style={styles.suggestionSectionTitle}>{section.category}</Text>
                  {section.items.map((item) => (
                    <Pressable
                      key={item}
                      style={styles.suggestionPill}
                      onPress={() => {
                        setInputText(item);
                        sendMessage(item);
                      }}
                    >
                      <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                      <Text style={styles.suggestionText}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        }
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
      />

      {/* Error STT */}
      {sttError && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color="#FFF" />
          <Text style={styles.errorText}>{sttError}</Text>
          <Pressable onPress={() => {}}>
            <Ionicons name="close" size={16} color="#FFF" />
          </Pressable>
        </View>
      )}

      {/* Input — cuando teclado cerrado: padding para tab bar. Cuando abierto: padding mínimo */}
      <View style={[styles.inputArea, { paddingBottom: keyboardVisible ? 12 : (90 + insets.bottom) }]}>
        <View style={styles.inputBar}>
          <Animated.View style={{ transform: [{ scale: recordingScale }] }}>
            <Pressable
              onPress={toggleMicrophone}
              style={[styles.iconBtn, isRecording && styles.recordingBtn]}
              disabled={isSttLoading}
            >
              <Ionicons name="mic" size={20} color={isRecording ? '#FFF' : Colors.primary} />
            </Pressable>
          </Animated.View>
          <TextInput
            style={styles.input}
            placeholder={isRecording ? 'Escuchando...' : isSttLoading ? 'Procesando...' : 'Escribe un mensaje...'}
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isRecording && !isSttLoading}
          />
          <Pressable
            onPress={handleSend}
            style={[
              styles.sendBtn,
              (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  resetBtn: {
    padding: 8,
  },
  // Messages
  messagesList: {
    paddingTop: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  suggestionsContainer: {
    width: '100%',
    maxHeight: 280,
  },
  suggestionSection: {
    marginBottom: 16,
  },
  suggestionSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  suggestionPill: {
    backgroundColor: Colors.primaryLight,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    flex: 1,
  },
  // Input
  inputArea: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recordingBtn: {
    backgroundColor: '#E63946',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 44,
    maxHeight: 100,
    color: Colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  // Error banner
  errorBanner: {
    backgroundColor: '#E63946',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
});
