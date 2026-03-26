import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Text from '../ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

const COLORS = {
  primary: '#1D9E75',
  white: '#FFFFFF',
  textPrimary: '#1A1D21',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E8ECF0',
};

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  timeAgo: string;
  read: boolean;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `Hace ${diffWeeks} semana${diffWeeks > 1 ? 's' : ''}`;
}

function getNotifIcon(type: string): { name: string; color: string; bg: string } {
  switch (type) {
    case 'like':
      return { name: 'heart', color: '#E24B4A', bg: '#E24B4A15' };
    case 'comment':
      return { name: 'chatbubble', color: '#378ADD', bg: '#378ADD15' };
    case 'report':
      return { name: 'alert-circle', color: '#D85A30', bg: '#D85A3015' };
    case 'join':
      return { name: 'people', color: COLORS.primary, bg: COLORS.primary + '15' };
    case 'resolved':
      return { name: 'checkmark-circle', color: COLORS.primary, bg: COLORS.primary + '15' };
    case 'badge':
      return { name: 'ribbon', color: '#BA7517', bg: '#BA751715' };
    case 'points':
      return { name: 'star', color: '#BA7517', bg: '#BA751715' };
    default:
      return { name: 'notifications', color: COLORS.textTertiary, bg: '#F3F4F6' };
  }
}

interface NotificationsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationsSheet({
  visible,
  onClose,
}: NotificationsSheetProps) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Error fetching notifications:', error.message);
      return;
    }

    const mapped: NotificationItem[] = (data ?? []).map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body ?? '',
      timeAgo: formatTimeAgo(n.created_at),
      read: n.is_read,
    }));

    setNotifications(mapped);
  }, []);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    }
  }, [visible, fetchNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Notificaciones</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSubtitle}>
                {unreadCount} sin leer
              </Text>
            )}
          </View>
          <Pressable style={styles.markReadBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Marcar leidas</Text>
          </Pressable>
        </View>

        {/* Content */}
        {loading && notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={56} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptySubtitle}>
              Aqui aparecerán las actualizaciones de tus reportes y la comunidad
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const icon = getNotifIcon(item.type);
              return (
                <Pressable
                  style={[
                    styles.notifRow,
                    !item.read && styles.notifUnread,
                  ]}
                >
                  <View style={styles.notifLeft}>
                    <View style={[styles.notifIconCircle, { backgroundColor: icon.bg }]}>
                      <Ionicons name={icon.name as any} size={20} color={icon.color} />
                    </View>
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    {item.body ? (
                      <Text style={styles.notifMessage} numberOfLines={2}>
                        {item.body}
                      </Text>
                    ) : null}
                    <Text style={styles.notifTime}>{item.timeAgo}</Text>
                  </View>
                  {!item.read && <View style={styles.unreadDot} />}
                </Pressable>
              );
            }}
          />
        )}
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  markReadBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '12',
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  notifUnread: {
    backgroundColor: '#F0FDF9',
  },
  notifLeft: {
    position: 'relative',
  },
  notifIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  notifMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  notifTime: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
