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
import { useColors } from '../../contexts/ThemeContext';
import ImageViewer from '../ImageViewer';

// -- Colores semanticos (categoria/status — no cambian con tema) --
const SEMANTIC = {
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
} as const;

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
  onCompletar?: (report: ReportData) => void;
  isOwnReport?: boolean;
}

export default function FeedCard({ report, onOpenComments, onPress, onSolicitar, onCompletar, isOwnReport }: FeedCardProps) {
  const router = useRouter();
  const { setHighlightedReportId } = useMapHighlight();
  const C = useColors();
  const styles = makeStyles(C);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(report.likesCount);
  const [shared, setShared] = useState(false);
  const [solicitado, setSolicitado] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

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
    router.push('/(tabs)/map' as any);
  };

  const categoryColor = SEMANTIC.category[report.category] || SEMANTIC.category.other;
  const statusStyle = SEMANTIC.status[report.status] || SEMANTIC.status.pending;
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
            <Ionicons name="location-sharp" size={12} color={C.textMuted} />
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
        <>
          <Pressable onPress={() => setImageViewerVisible(true)}>
            <Image source={{ uri: report.photoUrl }} style={styles.image} resizeMode="cover" />
          </Pressable>
          <ImageViewer
            visible={imageViewerVisible}
            imageUrl={report.photoUrl}
            onClose={() => setImageViewerVisible(false)}
          />
        </>
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
                  level <= report.severity ? C.accent : C.border,
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
            color={liked ? '#E24B4A' : C.textSecondary}
          />
          <Text style={[styles.actionText, liked && { color: '#E24B4A', fontWeight: '700' }]}>
            {likesCount}
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => onOpenComments(report)}
        >
          <Ionicons name="chatbubble-outline" size={20} color={C.textSecondary} />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleShare}>
          <Ionicons
            name={shared ? 'checkmark-circle' : 'share-social-outline'}
            size={20}
            color={shared ? C.primary : C.textSecondary}
          />
          <Text style={[styles.actionText, shared && { color: C.primary }]}>
            {shared ? 'Copiado' : 'Compartir'}
          </Text>
        </Pressable>

        <Pressable style={[styles.actionButton, styles.joinButton]} onPress={handleJoin}>
          <Ionicons name="hand-left-outline" size={18} color={C.primary} />
          <Text style={[styles.actionText, { color: C.primary, fontWeight: '600' }]}>
            Me uno
          </Text>
        </Pressable>

        {!isOwnReport && !!onSolicitar && report.status === 'pending' && (
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
              color={solicitado ? '#FFFFFF' : C.accent}
            />
            <Text style={[styles.actionText, { color: solicitado ? '#FFFFFF' : C.accent, fontWeight: '600' }]}>
              {solicitado ? 'Solicitado' : 'Solicitar'}
            </Text>
          </Pressable>
        )}

        {!isOwnReport && !!onCompletar && (report.status === 'verified' || report.status === 'in_progress') && (
          <Pressable
            style={[styles.actionButton, styles.completarButton]}
            onPress={() => onCompletar?.(report)}
          >
            <Ionicons name="checkmark-done-outline" size={16} color={C.primary} />
            <Text style={[styles.actionText, { color: C.primary, fontWeight: '600' }]}>
              Completar
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const makeStyles = (C: any) => StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 18,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: C.border,
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
    color: C.text,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: C.textMuted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.textMuted,
    marginHorizontal: 6,
  },
  locationSmall: {
    fontSize: 12,
    color: C.textMuted,
    marginLeft: 2,
    maxWidth: 120,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
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
    color: C.textSecondary,
    lineHeight: 21,
    marginBottom: 14,
  },
  image: {
    width: '100%',
    height: 232,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: '#E8ECF0',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 12,
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
    gap: 5,
    marginBottom: 14,
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
    marginRight: 2,
  },
  severityDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    gap: 5,
  },
  actionButtonActive: {
    backgroundColor: C.borderLight,
  },
  actionText: {
    fontSize: 13,
    color: C.textSecondary,
    fontWeight: '600',
  },
  joinButton: {
    marginLeft: 'auto',
    backgroundColor: C.primary + '14',
    borderWidth: 1,
    borderColor: C.primary + '3A',
  },
  solicitarButton: {
    backgroundColor: C.accent + '12',
    borderWidth: 1,
    borderColor: C.accent + '30',
  },
  solicitadoButton: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  completarButton: {
    backgroundColor: C.primary + '12',
    borderWidth: 1,
    borderColor: C.primary + '30',
  },
});
