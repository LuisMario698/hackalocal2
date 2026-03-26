import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.centerWrap}>
          <View style={[styles.card, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
            <View style={styles.cardHeader}>
              <View style={styles.badgeCircle}>
                <Ionicons name="create-outline" size={18} color={PRIMARY} />
              </View>
              <View style={styles.cardHeaderTextWrap}>
                <Text style={styles.headerTitle}>Nueva publicacion</Text>
                <Text style={styles.headerSubtitle}>Comparte un aviso con tu comunidad</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={handleClose}>
                <Ionicons name="close" size={18} color="#4B5563" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.formArea}
            >
              <Text style={styles.sectionLabel}>Tipo de publicacion</Text>
              <View style={styles.typeRow}>
                {POST_TYPES.map((t) => {
                  const active = selectedType === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      style={[styles.typePill, active && { backgroundColor: t.color + '16', borderColor: t.color + '4D' }]}
                      onPress={() => setSelectedType(t.key)}
                    >
                      <Ionicons name={t.icon as any} size={16} color={active ? t.color : '#9CA3AF'} />
                      <Text style={[styles.typeLabel, active && { color: t.color, fontWeight: '700' }]}>{t.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>Titulo</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Ej: Recoleccion suspendida manana"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />

              <Text style={styles.sectionLabel}>Contenido</Text>
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
            </ScrollView>

            <View style={styles.actionsRow}>
              <Pressable style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit || submitting}
                style={[styles.publishBtn, (!canSubmit || submitting) && styles.publishBtnDisabled]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#FFF" />
                    <Text style={styles.publishText}>Publicar</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,12,20,0.36)',
  },
  centerWrap: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 14,
    maxHeight: '78%',
    borderWidth: 1,
    borderColor: '#E4EBF3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  badgeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1D21',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6FA',
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  formArea: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B6573',
    marginBottom: 8,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    minWidth: 126,
  },
  publishBtnDisabled: {
    opacity: 0.45,
  },
  publishText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E3E8EF',
  },
  typeLabel: {
    fontSize: 13,
    color: '#8A94A3',
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1D21',
    borderWidth: 1,
    borderColor: '#E3E9F0',
    borderRadius: 14,
    backgroundColor: '#FDFEFE',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  contentInput: {
    fontSize: 15,
    color: '#1A1D21',
    lineHeight: 22,
    minHeight: 130,
    maxHeight: 220,
    borderWidth: 1,
    borderColor: '#E3E9F0',
    borderRadius: 14,
    backgroundColor: '#FDFEFE',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#94A0B0',
    textAlign: 'right',
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E9F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#586271',
  },
});
