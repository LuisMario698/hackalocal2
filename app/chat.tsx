import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Text from '../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatBubble from '../components/chat/ChatBubble';
import TypingIndicator from '../components/chat/TypingIndicator';
import { ChatMessage, useChat } from '../hooks/useChat';
import { Colors } from '../constants/Colors';
import { CURRENT_USER } from '../constants/MockData';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');

  // Mapeo de rol mock → rol DB
  const roleMap: Record<string, 'client' | 'association' | 'admin'> = {
    citizen: 'client',
    organization: 'association',
    authority: 'admin',
    business: 'client',
  };

  const { messages, isLoading, sendMessage, resetChat } = useChat({
    userId: CURRENT_USER.id,
    userRole: roleMap[CURRENT_USER.role] || 'client',
  });

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <ChatBubble role={item.role} content={item.content} />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>SC</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Asistente IA</Text>
            <Text style={styles.headerSub}>Social Clean</Text>
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
              Puedo ayudarte a crear reportes, consultar tus puntos, ver recompensas y mucho
              más. ¡Pregúntame lo que necesites!
            </Text>
            <View style={styles.suggestions}>
              {[
                '¿Cuántos eco-puntos tengo?',
                'Quiero reportar basura',
                '¿Qué recompensas hay?',
              ].map((s) => (
                <Pressable
                  key={s}
                  style={styles.suggestionPill}
                  onPress={() => {
                    setInputText(s);
                    sendMessage(s);
                  }}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListFooterComponent={isLoading ? <TypingIndicator /> : null}
      />

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit
        />
        <Pressable
          onPress={handleSend}
          style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={20} color="#FFF" />
        </Pressable>
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 10,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resetBtn: {
    padding: 8,
  },
  // Messages
  messagesList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 60,
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  suggestions: {
    gap: 10,
    width: '100%',
  },
  suggestionPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: Colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
