import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommentData } from './FeedCard';

const COLORS = {
  primary: '#1D9E75',
  white: '#FFFFFF',
  textPrimary: '#1A1D21',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E8ECF0',
  overlay: 'rgba(0,0,0,0.5)',
};

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

function getAvatarColor(name: string): string {
  const greens = ['#1D9E75', '#16a34a', '#15803d', '#0d9488', '#059669', '#047857'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return greens[Math.abs(hash) % greens.length];
}

interface CommentsSheetProps {
  visible: boolean;
  comments: CommentData[];
  reportTitle: string;
  onClose: () => void;
  onAddComment: (text: string) => void;
}

export default function CommentsSheet({
  visible,
  comments,
  reportTitle,
  onClose,
  onAddComment,
}: CommentsSheetProps) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const keyboardPadding = useRef(new Animated.Value(0)).current;
  const [newComment, setNewComment] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardPadding, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? 250 : 150,
        useNativeDriver: false,
      }).start();
    });

    const onHide = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardPadding, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? 200 : 100,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [keyboardPadding]);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(SHEET_HEIGHT);
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 9,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleSend = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Overlay */}
        <Pressable style={styles.overlay} onPress={handleClose} />

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 8), transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comentarios</Text>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          {/* Report title reference */}
          <View style={styles.reportRef}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.reportRefText} numberOfLines={1}>
              {reportTitle}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Comments list */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
            contentContainerStyle={
              comments.length === 0 ? styles.emptyContainer : styles.commentsContent
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={COLORS.border} />
                <Text style={styles.emptyTitle}>Sin comentarios todavia</Text>
                <Text style={styles.emptySubtitle}>
                  Se el primero en comentar sobre este reporte
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                <View style={[styles.commentAvatar, { backgroundColor: getAvatarColor(item.userName) }]}>
                  <Text style={styles.commentAvatarText}>{item.userInitials}</Text>
                </View>
                <View style={styles.commentBody}>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentUserName}>{item.userName}</Text>
                    <Text style={styles.commentTime}>{item.timeAgo}</Text>
                  </View>
                  <Text style={styles.commentText}>{item.text}</Text>
                  <View style={styles.commentActions}>
                    <Pressable style={styles.commentAction}>
                      <Ionicons name="heart-outline" size={14} color={COLORS.textTertiary} />
                      <Text style={styles.commentActionText}>Me gusta</Text>
                    </Pressable>
                    <Pressable style={styles.commentAction}>
                      <Text style={styles.commentActionText}>Responder</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Input bar */}
            <View style={styles.inputBar}>
              <View style={[styles.inputAvatar, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.inputAvatarText}>TU</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Agrega un comentario..."
                placeholderTextColor={COLORS.textTertiary}
                value={newComment}
                onChangeText={setNewComment}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                multiline
                maxLength={500}
              />
              <Pressable
                style={[
                  styles.sendButton,
                  newComment.trim() ? styles.sendButtonActive : {},
                ]}
                onPress={handleSend}
                disabled={!newComment.trim()}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={newComment.trim() ? COLORS.white : COLORS.textTertiary}
                />
              </Pressable>
            </View>

          {/* Keyboard spacer */}
          <Animated.View style={{ height: keyboardPadding }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportRef: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 6,
  },
  reportRefText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  commentBody: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  commentTime: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 10,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8ECF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
  },
});
