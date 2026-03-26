import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
import { decode } from 'base64-arraybuffer';
import { ChatMessage, useChat } from '../../hooks/useChat';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { File as ExpoFile } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import ReportMapPicker from '../../components/ReportMapPicker';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useLanguage } from '../../contexts/LanguageContext';

const getSuggestions = (t: (k: string) => string) => [
  {
    category: t('chat_sugg_cat1'),
    items: [t('chat_sugg_cat1_1'), t('chat_sugg_cat1_2'), t('chat_sugg_cat1_3')],
  },
  {
    category: t('chat_sugg_cat2'),
    items: [t('chat_sugg_cat2_1'), t('chat_sugg_cat2_2'), t('chat_sugg_cat2_3')],
  },
  {
    category: t('chat_sugg_cat3'),
    items: [t('chat_sugg_cat3_1'), t('chat_sugg_cat3_2'), t('chat_sugg_cat3_3')],
  },
  {
    category: t('chat_sugg_cat4'),
    items: [t('chat_sugg_cat4_1'), t('chat_sugg_cat4_2')],
  },
];

export default function ChatTabScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const { t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mapSelectedImage, setMapSelectedImage] = useState<string | null>(null);
  const [mapUploadedUrl, setMapUploadedUrl] = useState<string | null>(null);
  const [isMapUploading, setIsMapUploading] = useState(false);
  const recordingScale = useRef(new Animated.Value(1)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Map picker state for report creation
  const [mapVisible, setMapVisible] = useState(false);
  const [pendingDraftId, setPendingDraftId] = useState<string | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [pinCoord, setPinCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const { location } = useUserLocation();
  const mapRef = useRef<any>(null);

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

  const { messages, isLoading, sendMessage, resetChat, confirmReport } = useChat({
    userId: user?.id ?? '',
    userRole: (profile?.role as 'client' | 'association' | 'admin') ?? 'client',
  });

  // Detectar cuando hay un borrador pendiente y mostrar mapa
  React.useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.pendingDraftId && !mapVisible) {
      setPendingDraftId(lastMsg.pendingDraftId);
      // Si el usuario adjuntó imagen recientemente, guardarla
      const userMsgsWithImage = messages.filter(m => m.role === 'user' && m.image_url);
      if (userMsgsWithImage.length > 0) {
        setPendingImageUrl(userMsgsWithImage[userMsgsWithImage.length - 1].image_url!);
      }
      setPinCoord(null);
      setMapVisible(true);
    }
  }, [messages]);

  const handleMapPress = (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    setPinCoord(e.nativeEvent.coordinate);
  };

  const handleConfirmLocation = async () => {
    if (!pinCoord || !pendingDraftId) return;
    setMapVisible(false);
    const imageToUse = mapUploadedUrl || pendingImageUrl;
    await confirmReport(pendingDraftId, pinCoord.latitude, pinCoord.longitude, imageToUse ?? undefined);
    setPendingDraftId(null);
    setPendingImageUrl(null);
    setPinCoord(null);
    setMapSelectedImage(null);
    setMapUploadedUrl(null);
  };

  const pickMapImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setMapSelectedImage(uri);
      uploadMapImage(uri);
    }
  };

  const takeMapPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('error'), t('chat_err_camera'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setMapSelectedImage(uri);
      uploadMapImage(uri);
    }
  };

  const uploadMapImage = async (uri: string) => {
    setIsMapUploading(true);
    try {
      const fileName = `report-${user?.id ?? 'anon'}/${Date.now()}.jpg`;
      let uploadData: ArrayBuffer | Blob;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        uploadData = await response.blob();
      } else {
        const file = new ExpoFile(uri);
        uploadData = await file.arrayBuffer();
      }

      const { error } = await supabase.storage
        .from('report-photos')
        .upload(fileName, uploadData, { contentType: 'image/jpeg' });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('report-photos')
        .getPublicUrl(fileName);
      setMapUploadedUrl(urlData.publicUrl);
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      Alert.alert(t('error'), t('chat_err_upload'));
      setMapSelectedImage(null);
    } finally {
      setIsMapUploading(false);
    }
  };

  const clearMapImage = () => {
    setMapSelectedImage(null);
    setMapUploadedUrl(null);
  };

  // Actualizar input cuando termina el STT
  React.useEffect(() => {
    if (transcript && !isRecording) {
      setInputText((prev) => prev + (prev ? ' ' : '') + transcript);
    }
  }, [transcript, isRecording]);

  const uploadImage = async (uri: string): Promise<string | undefined> => {
    try {
      const filename = `chat-${Date.now()}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from('report-photos')
        .upload(filename, blob, { contentType: 'image/jpeg' });

      if (!error) {
        const { data: urlData } = supabase.storage
          .from('report-photos')
          .getPublicUrl(filename);
        return urlData.publicUrl;
      }
    } catch (err) {
      console.error('Error uploading image:', err);
    }
    return undefined;
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text && !selectedImage) return;

    // Clear immediately
    setInputText('');
    const currentImage = selectedImage;
    setSelectedImage(null);

    let imageUrl: string | undefined;
    if (currentImage) {
      try {
        const filename = `chat-${Date.now()}.jpg`;
        const file = new ExpoFile(currentImage);
        const arrayBuffer = await file.arrayBuffer();
        const { error } = await supabase.storage
          .from('report-photos')
          .upload(filename, arrayBuffer, { contentType: 'image/jpeg' });

        if (!error) {
          const { data: urlData } = supabase.storage
            .from('report-photos')
            .getPublicUrl(filename);
          imageUrl = urlData.publicUrl;
        }
      } catch (err) {
        console.error('Error uploading image:', err);
      }
    }

    sendMessage(text || t('chat_attached_photo'), imageUrl);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
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
            <Text style={styles.headerTitle}>{t('chat_ai_assistant')}</Text>
            <Text style={styles.headerSub}>{t('chat_online')}</Text>
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
            <Text style={styles.emptyTitle}>{t('chat_welcome_title')}</Text>
            <Text style={styles.emptyText}>
              {t('chat_welcome_desc')}
            </Text>
            <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
              {getSuggestions(t).map((section) => (
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
        {selectedImage && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.imageThumbnail} />
            <Pressable onPress={() => setSelectedImage(null)} style={styles.removeImageBtn}>
              <Ionicons name="close" size={16} color="#FFF" />
            </Pressable>
          </View>
        )}
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
            placeholder={isRecording ? t('chat_input_listening') : isSttLoading ? t('chat_input_processing') : t('chat_input_placeholder')}
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
      {/* Map picker modal for report location */}
      <Modal visible={mapVisible} animationType="slide" transparent={false}>
        <View style={[styles.mapModal, { paddingTop: insets.top }]}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>{t('chat_map_title')}</Text>
            <Pressable onPress={() => { setMapVisible(false); setPendingDraftId(null); clearMapImage(); }}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <Text style={styles.mapHint}>{t('chat_map_hint')}</Text>
          <View style={styles.mapContainer}>
            <ReportMapPicker
              userLat={location?.latitude ?? 31.3182}
              userLng={location?.longitude ?? -113.5348}
              pinCoord={pinCoord}
              onPress={handleMapPress}
              mapRef={mapRef}
              maxDistance={5000}
            />
          </View>
          {pinCoord && (
            <View style={styles.mapCoordInfo}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
              <Text style={styles.mapCoordText}>{t('chat_map_selected')}</Text>
            </View>
          )}

          {/* Image picker for report photo */}
          <View style={styles.mapImageSection}>
            <Text style={styles.mapImageLabel}>{t('chat_map_photo_label')}</Text>
            {mapSelectedImage ? (
              <View style={styles.mapImagePreview}>
                <Image source={{ uri: mapSelectedImage }} style={styles.mapImageThumb} />
                <View style={styles.mapImageInfo}>
                  <Text style={styles.mapImageText} numberOfLines={1}>
                    {isMapUploading ? t('chat_map_uploading') : t('chat_map_ready')}
                  </Text>
                </View>
                <Pressable onPress={clearMapImage} style={styles.mapImageClose}>
                  <Ionicons name="close-circle" size={22} color={Colors.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.mapImageButtons}>
                <Pressable onPress={pickMapImage} style={styles.mapImageBtn}>
                  <Ionicons name="images-outline" size={20} color={Colors.primary} />
                  <Text style={styles.mapImageBtnText}>{t('chat_map_btn_gallery')}</Text>
                </Pressable>
                <Pressable onPress={takeMapPhoto} style={styles.mapImageBtn}>
                  <Ionicons name="camera-outline" size={20} color={Colors.primary} />
                  <Text style={styles.mapImageBtnText}>{t('chat_map_btn_camera')}</Text>
                </Pressable>
              </View>
            )}
          </View>

          <Pressable
            style={[styles.mapConfirmBtn, (!pinCoord || isMapUploading) && styles.mapConfirmBtnDisabled]}
            onPress={handleConfirmLocation}
            disabled={!pinCoord || isMapUploading}
          >
            <Ionicons name="checkmark" size={20} color="#FFF" />
            <Text style={styles.mapConfirmText}>{t('chat_map_confirm')}</Text>
          </Pressable>
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
  imagePreview: {
    marginBottom: 10,
    position: 'relative',
    alignSelf: 'flex-start',
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
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
  // Map modal
  mapModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  mapHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  mapContainer: {
    flex: 1,
    minHeight: 450,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
  },
  mapCoordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  mapCoordText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Map image section
  mapImageSection: {
    marginBottom: 12,
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
  mapConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 30,
  },
  mapConfirmBtnDisabled: {
    opacity: 0.4,
  },
  mapConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
