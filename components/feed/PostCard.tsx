import React, { useState } from 'react';
import { Image, Pressable, Share, Platform, StyleSheet, View } from 'react-native';
import Text from '../ScaledText';
import { Ionicons } from '@expo/vector-icons';
import ImageViewer from '../ImageViewer';

const COLORS = {
  primary: '#1D9E75',
  white: '#FFFFFF',
  textPrimary: '#1A1D21',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E8ECF0',
};

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  info: { icon: 'information-circle', label: 'Informacion', color: '#378ADD' },
  notice: { icon: 'megaphone', label: 'Aviso', color: '#E24B4A' },
  educational: { icon: 'school', label: 'Educativo', color: '#7F77DD' },
  report: { icon: 'alert-circle', label: 'Reporte', color: '#F59E0B' },
};

export interface PostData {
  id: string;
  userName: string;
  userInitials: string;
  timeAgo: string;
  type: 'info' | 'notice' | 'educational' | 'report';
  priority: string;
  title: string;
  content: string;
  isPinned: boolean;
  likesCount: number;
  commentsCount: number;
  photoUrl?: string;
  initialComments?: { id: string; userName: string; userInitials: string; text: string; timeAgo: string }[];
}

function getAvatarColor(name: string): string {
  const greens = ['#1D9E75', '#16a34a', '#15803d', '#0d9488', '#059669', '#047857'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return greens[Math.abs(hash) % greens.length];
}

interface PostCardProps {
  post: PostData;
  onOpenComments?: (post: PostData) => void;
  onPress?: (post: PostData) => void;
}

export default function PostCard({ post, onOpenComments, onPress }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const typeConf = TYPE_CONFIG[post.type] || TYPE_CONFIG.info;
  const avatarBg = getAvatarColor(post.userName);

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(`${post.title}\n${post.content}\n\nPublicado en Social Clean`);
        }
      } else {
        await Share.share({ title: post.title, message: `${post.title}\n${post.content}\n\nPublicado en Social Clean` });
      }
    } catch {}
  };

  return (
    <Pressable style={styles.card} onPress={() => onPress?.(post)}>
      {post.isPinned && (
        <View style={styles.pinnedBanner}>
          <Ionicons name="pin" size={12} color="#F59E0B" />
          <Text style={styles.pinnedText}>Fijado</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>{post.userInitials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{post.userName}</Text>
          <Text style={styles.timeAgo}>{post.timeAgo}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: typeConf.color + '18' }]}>
          <Ionicons name={typeConf.icon as any} size={13} color={typeConf.color} />
          <Text style={[styles.typeText, { color: typeConf.color }]}>{typeConf.label}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.content} numberOfLines={4}>{post.content}</Text>

      {/* Image */}
      {post.photoUrl && (
        <Pressable onPress={() => setImageViewerVisible(true)}>
          <Image source={{ uri: post.photoUrl }} style={styles.postImage} resizeMode="cover" />
        </Pressable>
      )}

      {/* Fullscreen image viewer */}
      {post.photoUrl && (
        <ImageViewer
          visible={imageViewerVisible}
          imageUrl={post.photoUrl}
          onClose={() => setImageViewerVisible(false)}
        />
      )}

      {/* Inline comments preview */}
      {post.initialComments && post.initialComments.length > 0 && (
        <View style={styles.commentsPreview}>
          {post.initialComments.slice(0, 2).map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <Text style={styles.commentUser}>{c.userName}</Text>
              <Text style={styles.commentText} numberOfLines={1}>{c.text}</Text>
            </View>
          ))}
          {post.commentsCount > 2 && (
            <Pressable onPress={() => onOpenComments?.(post)}>
              <Text style={styles.viewMore}>Ver los {post.commentsCount} comentarios</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, liked && styles.actionButtonActive]} onPress={handleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#E24B4A' : COLORS.textSecondary} />
          <Text style={[styles.actionText, liked && { color: '#E24B4A', fontWeight: '700' }]}>{likesCount}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={() => onOpenComments?.(post)}>
          <Ionicons name="chatbubble-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>Compartir</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF3C7',
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 1,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  content: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#E8ECF0',
  },
  commentsPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  commentUser: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  commentText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  viewMore: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 5,
  },
  actionButtonActive: {
    backgroundColor: '#F3F4F6',
  },
  actionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
