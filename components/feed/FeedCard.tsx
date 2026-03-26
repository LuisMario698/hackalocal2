import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import Text from '../ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMapHighlight } from '../../contexts/MapHighlightContext';

// -- Colores del proyecto --
const COLORS = {
  primary: '#1D9E75',
  accent: '#D85A30',
  background: '#F5F7FA',
  white: '#FFFFFF',
  textPrimary: '#1A1D21',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E8ECF0',
  category: {
    trash: '#E24B4A',
    pothole: '#8B5E3C',
    drain: '#5B8FA8',
    water: '#378ADD',
    wildlife: '#BA7517',
    electronic: '#7F77DD',
    organic: '#1D9E75',
    other: '#6B7280',
  },
  status: {
    pending: { bg: '#FAEEDA', text: '#B8860B' },
    verified: { bg: '#E1F5EE', text: '#1D9E75' },
    in_progress: { bg: '#E6F1FB', text: '#2B6CB0' },
    resolved: { bg: '#E1F5EE', text: '#1D9E75' },
    rejected: { bg: '#FDE8E8', text: '#C53030' },
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  trash: 'Basura',
  pothole: 'Bache',
  drain: 'Drenaje',
  water: 'Agua',
  wildlife: 'Vida silvestre',
  electronic: 'Electronico',
  organic: 'Organico',
  other: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  verified: 'Verificado',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  rejected: 'Rechazado',
};

export interface CommentData {
  id: string;
  userName: string;
  userInitials: string;
  text: string;
  timeAgo: string;
}

export interface ReportData {
  id: string;
  userId?: string;
  userName: string;
  userInitials: string;
  timeAgo: string;
  category: 'trash' | 'pothole' | 'drain' | 'water' | 'wildlife' | 'electronic' | 'organic' | 'other';
  status: 'pending' | 'verified' | 'in_progress' | 'resolved' | 'rejected';
  title: string;
  description: string;
  location: string;
  photoUrl?: string;
  likesCount: number;
  commentsCount: number;
  severity: number;
  initialComments?: CommentData[];
}

function getAvatarColor(name: string): string {
  const greens = ['#1D9E75', '#16a34a', '#15803d', '#0d9488', '#059669', '#047857'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return greens[Math.abs(hash) % greens.length];
}

interface FeedCardProps {
  report: ReportData;
  onOpenComments: (report: ReportData) => void;
  onPress: (report: ReportData) => void;
  onSolicitar?: (report: ReportData) => void;
  isOwnReport?: boolean;
}

export default function FeedCard({ report, onOpenComments, onPress, onSolicitar, isOwnReport }: FeedCardProps) {
  const router = useRouter();
  const { setHighlightedReportId } = useMapHighlight();

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(report.likesCount);
  const [shared, setShared] = useState(false);
  const [solicitado, setSolicitado] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: report.title,
            text: `${report.title} - ${report.description}`,
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(
            `${report.title}\n${report.description}\n\nReportado en Social Clean`
          );
          setShared(true);
          setTimeout(() => setShared(false), 2000);
        }
      } else {
        await Share.share({
          title: report.title,
          message: `${report.title}\n${report.description}\n\nReportado por ${report.userName} en Social Clean`,
        });
      }
    } catch {
      // user cancelled share
    }
  };

  const handleJoin = () => {
    setHighlightedReportId(report.id);
    router.push('/map');
  };

  const categoryColor = COLORS.category[report.category] || COLORS.category.other;
  const statusStyle = COLORS.status[report.status] || COLORS.status.pending;
  const avatarBg = getAvatarColor(report.userName);
  const commentsCount = report.initialComments?.length ?? report.commentsCount;

  return (
    <Pressable style={styles.card} onPress={() => onPress(report)}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>{report.userInitials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{report.userName}</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.timeAgo}>{report.timeAgo}</Text>
            <View style={styles.dot} />
            <Ionicons name="location-sharp" size={12} color={COLORS.textTertiary} />
            <Text style={styles.locationSmall} numberOfLines={1}>
              {report.location}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {STATUS_LABELS[report.status]}
          </Text>
        </View>
      </View>

      {/* Title + Category */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{report.title}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '18' }]}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {CATEGORY_LABELS[report.category]}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {report.description}
      </Text>

      {/* Image */}
      {report.photoUrl ? (
        <Image source={{ uri: report.photoUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: categoryColor + '15' }]}>
          <Ionicons
            name={
              report.category === 'trash'
                ? 'trash-outline'
                : report.category === 'water'
                ? 'water-outline'
                : report.category === 'wildlife'
                ? 'leaf-outline'
                : report.category === 'electronic'
                ? 'hardware-chip-outline'
                : report.category === 'organic'
                ? 'nutrition-outline'
                : 'alert-circle-outline'
            }
            size={48}
            color={categoryColor + '60'}
          />
          <Text style={[styles.imagePlaceholderText, { color: categoryColor + '80' }]}>
            Reporte de {CATEGORY_LABELS[report.category].toLowerCase()}
          </Text>
        </View>
      )}

      {/* Comments preview */}
      {report.initialComments && report.initialComments.length > 0 && (
        <View style={styles.commentsPreview}>
          {report.initialComments.slice(0, 2).map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <Text style={styles.commentUser}>{c.userName}</Text>
              <Text style={styles.commentText} numberOfLines={1}>{c.text}</Text>
            </View>
          ))}
          {commentsCount > 2 && (
            <Pressable onPress={() => onOpenComments(report)}>
              <Text style={styles.viewMoreComments}>Ver los {commentsCount} comentarios</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Severity indicator */}
      <View style={styles.severityRow}>
        <Text style={styles.severityLabel}>Gravedad:</Text>
        {[1, 2, 3, 4, 5].map((level) => (
          <View
            key={level}
            style={[
              styles.severityDot,
              {
                backgroundColor:
                  level <= report.severity ? COLORS.accent : COLORS.border,
              },
            ]}
          />
        ))}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, liked && styles.actionButtonActive]}
          onPress={handleLike}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? '#E24B4A' : COLORS.textSecondary}
          />
          <Text style={[styles.actionText, liked && { color: '#E24B4A', fontWeight: '700' }]}>
            {likesCount}
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => onOpenComments(report)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleShare}>
          <Ionicons
            name={shared ? 'checkmark-circle' : 'share-social-outline'}
            size={20}
            color={shared ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.actionText, shared && { color: COLORS.primary }]}>
            {shared ? 'Copiado' : 'Compartir'}
          </Text>
        </Pressable>

        <Pressable style={[styles.actionButton, styles.joinButton]} onPress={handleJoin}>
          <Ionicons name="hand-left-outline" size={18} color={COLORS.primary} />
          <Text style={[styles.actionText, { color: COLORS.primary, fontWeight: '600' }]}>
            Me uno
          </Text>
        </Pressable>

        {!isOwnReport && report.status === 'pending' && (
          <Pressable
            style={[styles.actionButton, styles.solicitarButton, solicitado && styles.solicitadoButton]}
            onPress={() => {
              setSolicitado(!solicitado);
              if (!solicitado) onSolicitar?.(report);
            }}
          >
            <Ionicons
              name={solicitado ? 'checkmark-circle' : 'arrow-redo-outline'}
              size={16}
              color={solicitado ? '#FFFFFF' : COLORS.accent}
            />
            <Text style={[styles.actionText, { color: solicitado ? '#FFFFFF' : COLORS.accent, fontWeight: '600' }]}>
              {solicitado ? 'Solicitado' : 'Solicitar'}
            </Text>
          </Pressable>
        )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerMeta: {
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
  locationSmall: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginLeft: 2,
    maxWidth: 120,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#E8ECF0',
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    fontWeight: '500',
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  severityLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginRight: 4,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  joinButton: {
    marginLeft: 'auto',
    backgroundColor: COLORS.primary + '12',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  solicitarButton: {
    backgroundColor: COLORS.accent + '12',
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  solicitadoButton: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  commentsPreview: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
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
  viewMoreComments: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
});
