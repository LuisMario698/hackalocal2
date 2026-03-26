import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
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
import { useRouter } from 'expo-router';
import { useMapHighlight } from '../../contexts/MapHighlightContext';
import { CommentData, ReportData } from './FeedCard';

const COLORS = {
  primary: '#1D9E75',
  accent: '#D85A30',
  white: '#FFFFFF',
  textPrimary: '#1A1D21',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E8ECF0',
  overlay: 'rgba(0,0,0,0.5)',
  category: {
    trash: '#E24B4A',
    water: '#378ADD',
    wildlife: '#BA7517',
    electronic: '#7F77DD',
    organic: '#1D9E75',
    other: '#6B7280',
  },
  status: {
    pending: { bg: '#FAEEDA', text: '#B8860B' },
    in_progress: { bg: '#E6F1FB', text: '#2B6CB0' },
    resolved: { bg: '#E1F5EE', text: '#1D9E75' },
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  trash: 'Basura',
  water: 'Agua',
  wildlife: 'Vida silvestre',
  electronic: 'Electronico',
  organic: 'Organico',
  other: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
};

function getAvatarColor(name: string): string {
  const greens = ['#1D9E75', '#16a34a', '#15803d', '#0d9488', '#059669', '#047857'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return greens[Math.abs(hash) % greens.length];
}

interface ReportDetailProps {
  visible: boolean;
  report: ReportData | null;
  comments: CommentData[];
  onClose: () => void;
  onAddComment: (text: string) => void;
  onLikeToggle: () => void;
  liked: boolean;
  likesCount: number;
}

export default function ReportDetail({
  visible,
  report,
  comments,
  onClose,
  onAddComment,
  onLikeToggle,
  liked,
  likesCount,
}: ReportDetailProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setHighlightedReportId } = useMapHighlight();

  const [newComment, setNewComment] = useState('');
  const keyboardPadding = useRef(new Animated.Value(0)).current;

  const handleJoin = () => {
    if (report) {
      setHighlightedReportId(report.id);
      onClose();
      router.push('/map');
    }
  };

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

  const handleSend = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  if (!report) return null;

  const categoryColor = COLORS.category[report.category as keyof typeof COLORS.category] || COLORS.category.other;
  const statusStyle = COLORS.status[report.status as keyof typeof COLORS.status] || COLORS.status.pending;
  const avatarBg = getAvatarColor(report.userName);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header bar */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Publicacion</Text>
          <Pressable style={styles.headerAction}>
            <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* User info */}
          <View style={styles.userRow}>
            <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
              <Text style={styles.avatarText}>{report.userInitials}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{report.userName}</Text>
              <View style={styles.userMeta}>
                <Text style={styles.timeAgo}>{report.timeAgo}</Text>
                <View style={styles.dot} />
                <Ionicons name="location-sharp" size={12} color={COLORS.textTertiary} />
                <Text style={styles.location}>{report.location}</Text>
              </View>
            </View>
          </View>

          {/* Image */}
          {report.photoUrl && (
            <Image source={{ uri: report.photoUrl }} style={styles.image} resizeMode="cover" />
          )}

          {/* Actions bar */}
          <View style={styles.actionsBar}>
            <View style={styles.actionsLeft}>
              <Pressable style={styles.actionBtn} onPress={onLikeToggle}>
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  size={26}
                  color={liked ? '#E24B4A' : COLORS.textPrimary}
                />
              </Pressable>
              <Pressable style={styles.actionBtn}>
                <Ionicons name="chatbubble-outline" size={24} color={COLORS.textPrimary} />
              </Pressable>
              <Pressable style={styles.actionBtn}>
                <Ionicons name="share-social-outline" size={24} color={COLORS.textPrimary} />
              </Pressable>
            </View>
            <Pressable style={styles.joinBtnDetail} onPress={handleJoin}>
              <Ionicons name="hand-left-outline" size={18} color={COLORS.primary} />
              <Text style={styles.joinBtnText}>Me uno</Text>
            </Pressable>
          </View>

          {/* Likes count */}
          <Text style={styles.likesText}>{likesCount} apoyos</Text>

          {/* Title + badges */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{report.title}</Text>
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: categoryColor + '18' }]}>
                <View style={[styles.badgeDot, { backgroundColor: categoryColor }]} />
                <Text style={[styles.badgeText, { color: categoryColor }]}>
                  {CATEGORY_LABELS[report.category] || report.category}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                  {STATUS_LABELS[report.status] || report.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{report.description}</Text>

          {/* Severity */}
          <View style={styles.severitySection}>
            <Text style={styles.severityLabel}>Nivel de gravedad</Text>
            <View style={styles.severityBar}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.severityBlock,
                    {
                      backgroundColor:
                        level <= report.severity ? COLORS.accent : COLORS.border,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.severityValue}>{report.severity}/5</Text>
          </View>

          {/* Location detail */}
          <View style={styles.locationSection}>
            <Ionicons name="location" size={18} color={COLORS.primary} />
            <View>
              <Text style={styles.locationTitle}>Ubicacion del reporte</Text>
              <Text style={styles.locationAddress}>{report.location}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.sectionDivider} />

          {/* Comments section - inline */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comentarios ({comments.length})
            </Text>

            {comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubbles-outline" size={36} color={COLORS.border} />
                <Text style={styles.emptyText}>Sin comentarios todavia</Text>
                <Text style={styles.emptySubtext}>Se el primero en comentar</Text>
              </View>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentRow}>
                  <View
                    style={[
                      styles.commentAvatar,
                      { backgroundColor: getAvatarColor(comment.userName) },
                    ]}
                  >
                    <Text style={styles.commentAvatarText}>{comment.userInitials}</Text>
                  </View>
                  <View style={styles.commentBody}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentName}>{comment.userName}</Text>
                      <Text style={styles.commentTime}>{comment.timeAgo}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
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
              ))
            )}
          </View>
        </ScrollView>

        {/* Fixed input at bottom */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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
          />
          <Pressable
            style={[styles.sendBtn, newComment.trim() ? styles.sendBtnActive : {}]}
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

        <Animated.View style={{ height: keyboardPadding }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.textTertiary,
    marginHorizontal: 6,
  },
  location: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginLeft: 2,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: '#E8ECF0',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionsLeft: {
    flexDirection: 'row',
    gap: 14,
  },
  actionBtn: {
    padding: 4,
  },
  joinBtnDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  joinBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  titleSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  severitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  severityLabel: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  severityBar: {
    flexDirection: 'row',
    gap: 3,
  },
  severityBlock: {
    width: 20,
    height: 8,
    borderRadius: 4,
  },
  severityValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  locationTitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sectionDivider: {
    height: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  commentsSection: {
    paddingHorizontal: 16,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 6,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  commentAvatarText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentName: {
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
    paddingTop: 10,
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
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    height: 38,
    backgroundColor: '#F3F4F6',
    borderRadius: 19,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8ECF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
  },
});
