import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import ReportMapPicker from '../components/ReportMapPicker';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');

  // Image picker state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Map modal state
  const [showMapModal, setShowMapModal] = useState(false);
  const [pendingDraftId, setPendingDraftId] = useState<string | null>(null);
  const [pinCoord, setPinCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number }>({
    latitude: 31.32,
    longitude: -113.536,
  });

  // Mapeo de rol mock → rol DB
  const roleMap: Record<string, 'client' | 'association' | 'admin'> = {
    citizen: 'client',
    organization: 'association',
    authority: 'admin',
    business: 'client',
  };

  const { messages, isLoading, sendMessage, resetChat, confirmReport } = useChat({
    userId: CURRENT_USER.id,
    userRole: roleMap[CURRENT_USER.role] || 'client',
  });

  // Watch messages for pending drafts
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.pendingDraftId) {
      setPendingDraftId(lastMsg.pendingDraftId);
      openMapModal();
    }
  }, [messages]);

  // Get user location
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación para seleccionar dónde está el reporte.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      // Use default location
    }
  };

  const openMapModal = async () => {
    await getUserLocation();
    setPinCoord(null);
    setShowMapModal(true);
  };

  // Image picker
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        setIsUploading(true);

        try {
          // Upload to Supabase Storage
          const fileName = `chat-images/${CURRENT_USER.id}/${Date.now()}.jpg`;

          if (Platform.OS === 'web') {
            // Web: fetch blob and upload
            const response = await fetch(uri);
            const blob = await response.blob();
            const { error } = await supabase.storage
              .from('reports')
              .upload(fileName, blob, { contentType: 'image/jpeg' });
            if (error) throw error;
          } else {
            // Native: read as base64 and upload
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: 'base64' as any,
            });
            const arrayBuffer = decode(base64);
            const { error } = await supabase.storage
              .from('reports')
              .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
            if (error) throw error;
          }

          const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
          setUploadedImageUrl(urlData.publicUrl);
        } catch (err) {
          console.error('Error uploading image:', err);
          Alert.alert('Error', 'No se pudo subir la imagen. Intenta de nuevo.');
          setSelectedImage(null);
        } finally {
          setIsUploading(false);
        }
      }
    } catch {
      // User cancelled
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);
        setIsUploading(true);
        try {
          const fileName = `chat-images/${CURRENT_USER.id}/${Date.now()}.jpg`;
          if (Platform.OS === 'web') {
            const response = await fetch(uri);
            const blob = await response.blob();
            const { error } = await supabase.storage
              .from('reports')
              .upload(fileName, blob, { contentType: 'image/jpeg' });
            if (error) throw error;
          } else {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: 'base64' as any,
            });
            const arrayBuffer = decode(base64);
            const { error } = await supabase.storage
              .from('reports')
              .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
            if (error) throw error;
          }
          const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
          setUploadedImageUrl(urlData.publicUrl);
        } catch (err) {
          console.error('Error uploading image:', err);
          Alert.alert('Error', 'No se pudo subir la imagen. Intenta de nuevo.');
          setSelectedImage(null);
        } finally {
          setIsUploading(false);
        }
      }
    } catch {
      // User cancelled
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setUploadedImageUrl(null);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleMapPress = (e: any) => {
    const coord = e.nativeEvent?.coordinate || e.coordinate;
    if (coord) {
      setPinCoord({ latitude: coord.latitude, longitude: coord.longitude });
    }
  };

  const handleConfirmLocation = async () => {
    if (!pinCoord || !pendingDraftId) {
      Alert.alert('Selecciona ubicación', 'Toca el mapa para marcar dónde está el problema.');
      return;
    }

    setShowMapModal(false);
    await confirmReport(pendingDraftId, pinCoord.latitude, pinCoord.longitude, uploadedImageUrl || undefined);
    setPendingDraftId(null);
    setPinCoord(null);
    clearImage();
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

      {/* Map Modal */}
      <Modal visible={showMapModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.mapModalContainer, { paddingTop: insets.top }]}>
          {/* Map Modal Header */}
          <View style={styles.mapModalHeader}>
            <Pressable
              onPress={() => {
                setShowMapModal(false);
                setPendingDraftId(null);
                setPinCoord(null);
              }}
              style={styles.mapModalClose}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
            <Text style={styles.mapModalTitle}>Selecciona la ubicación</Text>
            <View style={{ width: 32 }} />
          </View>

          <Text style={styles.mapModalSubtitle}>
            Toca el mapa para marcar dónde se encuentra el problema
          </Text>

          {/* Map */}
          <View style={styles.mapWrapper}>
            <ReportMapPicker
              userLat={userLocation.latitude}
              userLng={userLocation.longitude}
              pinCoord={pinCoord}
              onPress={handleMapPress}
              maxDistance={100000}
            />
          </View>

          {pinCoord && (
            <Text style={styles.coordText}>
              📍 {pinCoord.latitude.toFixed(5)}, {pinCoord.longitude.toFixed(5)}
            </Text>
          )}

          {/* Optional image picker */}
          <View style={styles.mapImageSection}>
            <Text style={styles.mapImageLabel}>📷 Foto del problema (opcional)</Text>
            {selectedImage ? (
              <View style={styles.mapImagePreview}>
                <Image source={{ uri: selectedImage }} style={styles.mapImageThumb} />
                <View style={styles.mapImageInfo}>
                  <Text style={styles.mapImageText} numberOfLines={1}>
                    {isUploading ? 'Subiendo...' : 'Imagen lista ✓'}
                  </Text>
                </View>
                <Pressable onPress={clearImage} style={styles.mapImageClose}>
                  <Ionicons name="close-circle" size={22} color={Colors.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.mapImageButtons}>
                <Pressable onPress={pickImage} style={styles.mapImageBtn}>
                  <Ionicons name="images-outline" size={20} color={Colors.primary} />
                  <Text style={styles.mapImageBtnText}>Galería</Text>
                </Pressable>
                <Pressable onPress={takePhoto} style={styles.mapImageBtn}>
                  <Ionicons name="camera-outline" size={20} color={Colors.primary} />
                  <Text style={styles.mapImageBtnText}>Cámara</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Confirm button */}
          <View style={[styles.mapModalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable
              style={[styles.confirmBtn, (!pinCoord || isUploading) && styles.confirmBtnDisabled]}
              onPress={handleConfirmLocation}
              disabled={!pinCoord || isUploading}
            >
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={styles.confirmBtnText}>Confirmar Ubicación</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  // Map Modal
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mapModalClose: {
    padding: 4,
  },
  mapModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  mapModalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  mapWrapper: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  coordText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  mapModalFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  // Map image section
  mapImageSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  mapImageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  mapImageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  mapImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  mapImageBtnText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  mapImagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 8,
  },
  mapImageThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  mapImageInfo: {
    flex: 1,
    marginLeft: 10,
  },
  mapImageText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  mapImageClose: {
    padding: 4,
  },
});
