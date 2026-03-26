import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Text from '../../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChatBubble from '../../components/chat/ChatBubble';
import TypingIndicator from '../../components/chat/TypingIndicator';
import { ChatMessage, useChat } from '../../hooks/useChat';
import { Colors } from '../../constants/Colors';
import { CURRENT_USER } from '../../constants/MockData';
import * as ImagePicker from 'expo-image-picker';
import * as Audio from 'expo-av';
import { supabase } from '../../lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingScale = useRef(new Animated.Value(1)).current;

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

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    // Si hay imagen, subirla primero
    let imageUrl: string | undefined;
    if (selectedImage) {
      try {
        const filename = `${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
          .from('report-photos')
          .upload(filename, {
            uri: selectedImage,
            type: 'image/jpeg',
            name: filename,
          } as any);

        if (error) throw error;

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('report-photos')
          .getPublicUrl(filename);
        imageUrl = urlData.publicUrl;
      } catch (err) {
        console.error('Error uploading image:', err);
        // Continuar sin imagen en caso de error
      }
    }

    sendMessage(inputText, imageUrl);
    setInputText('');
    setSelectedImage(null);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.log('Audio permission not granted');
        return;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();

      setIsRecording(true);

      // Pulse animation
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

      // Guardar la instancia para usarla en stopRecording
      (global as any).currentRecording = recording;
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = async () => {
    try {
      const recording = (global as any).currentRecording;
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      setIsRecording(false);
      recordingScale.setValue(1);

      const uri = recording.getURI();
      if (uri) {
        // Convertir a base64
        const base64 = await convertUriToBase64(uri);

        // Enviar a transcribe-audio function
        try {
          const response = await fetch(
            `${SUPABASE_URL}/functions/v1/transcribe-audio`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await getAuthToken()}`,
              },
              body: JSON.stringify({ audio_base64: base64 }),
            }
          );

          const data = await response.json();
          if (data.text) {
            setInputText(data.text);
          } else if (data.error) {
            console.error('Transcription error:', data.error);
          }
        } catch (err) {
          console.error('Error transcribing audio:', err);
        }
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
    }
  };

  const toggleMicrophone = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || '';
  };

  const convertUriToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <ChatBubble role={item.role} content={item.content} imageUrl={item.image_url} />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
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

      {/* Input */}
      <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.imageThumbnail} />
            <Pressable
              onPress={() => setSelectedImage(null)}
              style={styles.removeImageBtn}
            >
              <Ionicons name="close" size={16} color="#FFF" />
            </Pressable>
          </View>
        )}
        <View style={styles.inputBar}>
          <Animated.View style={{ transform: [{ scale: recordingScale }] }}>
            <Pressable
              onPress={toggleMicrophone}
              style={[styles.iconBtn, isRecording && styles.recordingBtn]}
            >
              <Ionicons name="mic" size={20} color={isRecording ? '#FFF' : Colors.primary} />
            </Pressable>
          </Animated.View>
          <Pressable onPress={takePhoto} style={styles.iconBtn}>
            <Ionicons name="camera" size={20} color={Colors.primary} />
          </Pressable>
          <Pressable onPress={pickImage} style={styles.iconBtn}>
            <Ionicons name="image" size={20} color={Colors.primary} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder={isRecording ? 'Grabando...' : 'Escribe un mensaje...'}
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isRecording}
          />
          <Pressable
            onPress={handleSend}
            style={[
              styles.sendBtn,
              (!inputText.trim() && !selectedImage || isLoading) && styles.sendBtnDisabled,
            ]}
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
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
    paddingVertical: 16,
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
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  imagePreview: {
    marginBottom: 10,
    position: 'relative',
  },
  imageThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingBtn: {
    backgroundColor: '#E63946',
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
