import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Text from '../ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY = '#1D9E75';

const POST_TYPES = [
  { key: 'info', label: 'Informacion', icon: 'information-circle', color: '#378ADD' },
  { key: 'notice', label: 'Aviso', icon: 'megaphone', color: '#E24B4A' },
  { key: 'educational', label: 'Educativo', icon: 'school', color: '#7F77DD' },
] as const;

interface CreatePostSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; type: string }) => Promise<void>;
}

export default function CreatePostSheet({ visible, onClose, onSubmit }: CreatePostSheetProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState<string>('info');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), content: content.trim(), type: selectedType });
      setTitle('');
      setContent('');
      setSelectedType('info');
      onClose();
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setTitle('');
    setContent('');
    setSelectedType('info');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Text style={styles.headerTitle}>Nueva publicacion</Text>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              style={[styles.publishBtn, (!canSubmit || submitting) && styles.publishBtnDisabled]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.publishText}>Publicar</Text>
              )}
            </Pressable>
          </View>

          {/* Type selector */}
          <View style={styles.typeRow}>
            {POST_TYPES.map((t) => {
              const active = selectedType === t.key;
              return (
                <Pressable
                  key={t.key}
                  style={[styles.typePill, active && { backgroundColor: t.color + '18', borderColor: t.color + '40' }]}
                  onPress={() => setSelectedType(t.key)}
                >
                  <Ionicons name={t.icon as any} size={16} color={active ? t.color : '#9CA3AF'} />
                  <Text style={[styles.typeLabel, active && { color: t.color, fontWeight: '700' }]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Title */}
          <TextInput
            style={styles.titleInput}
            placeholder="Titulo de tu publicacion"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Content */}
          <TextInput
            style={styles.contentInput}
            placeholder="Escribe tu mensaje para la comunidad..."
            placeholderTextColor="#9CA3AF"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          <Text style={styles.charCount}>{content.length}/500</Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cancelText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D21',
  },
  publishBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  publishBtnDisabled: {
    opacity: 0.4,
  },
  publishText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  typeLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1D21',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
    paddingVertical: 12,
    marginBottom: 12,
  },
  contentInput: {
    fontSize: 15,
    color: '#1A1D21',
    lineHeight: 22,
    minHeight: 120,
    maxHeight: 200,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
});
