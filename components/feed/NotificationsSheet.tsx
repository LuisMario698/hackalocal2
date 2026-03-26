import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Text from '../ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  type: 'like' | 'comment' | 'report' | 'join' | 'resolved';
  userName: string;
  userInitials: string;
  message: string;
  timeAgo: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'like',
    userName: 'Pedro Gomez',
    userInitials: 'PG',
    message: 'le dio apoyo a tu reporte "Acumulacion de basura en playa norte"',
    timeAgo: 'Hace 5 min',
    read: false,
  },
  {
    id: 'n2',
    type: 'comment',
    userName: 'Laura Rios',
    userInitials: 'LR',
    message: 'comento en "Acumulacion de basura en playa norte": "Ya reporte esto al municipio..."',
    timeAgo: 'Hace 10 min',
    read: false,
  },
  {
    id: 'n3',
    type: 'join',
    userName: 'Carlos Mendoza',
    userInitials: 'CM',
    message: 'se unio a la tarea del reporte "Contaminacion en arroyo municipal"',
    timeAgo: 'Hace 30 min',
    read: false,
  },
  {
    id: 'n4',
    type: 'report',
    userName: 'Ana Torres',
    userInitials: 'AT',
    message: 'publico un nuevo reporte cerca de tu ubicacion: "Aves marinas atrapadas en redes"',
    timeAgo: 'Hace 2 horas',
    read: true,
  },
  {
    id: 'n5',
    type: 'resolved',
    userName: 'Municipio de Guaymas',
    userInitials: 'MG',
    message: 'marco como resuelto el reporte "Residuos organicos en mercado local"',
    timeAgo: 'Hace 5 horas',
    read: true,
  },
  {
    id: 'n6',
    type: 'like',
    userName: 'Fernando Castillo',
    userInitials: 'FC',
    message: 'y 12 personas mas dieron apoyo a "Tortugas marinas en zona de anidacion"',
    timeAgo: 'Hace 8 horas',
    read: true,
  },
  {
    id: 'n7',
    type: 'comment',
    userName: 'Patricia Vega',
    userInitials: 'PV',
    message: 'comento en "Fuga de agua tratada": "Excelente respuesta de la planta tratadora..."',
    timeAgo: 'Hace 20 horas',
    read: true,
  },
  {
    id: 'n8',
    type: 'join',
    userName: 'Roberto Diaz',
    userInitials: 'RD',
    message: 'se unio a la jornada de limpieza en Playa Miramar este sabado',
    timeAgo: 'Hace 1 dia',
    read: true,
  },
  {
    id: 'n9',
    type: 'report',
    userName: 'Jorge Ramirez',
    userInitials: 'JR',
    message: 'publico un nuevo reporte: "Basura acumulada en canal pluvial"',
    timeAgo: 'Hace 1 dia',
    read: true,
  },
  {
    id: 'n10',
    type: 'resolved',
    userName: 'Proteccion Civil',
    userInitials: 'PC',
    message: 'verifico la limpieza del reporte "Fuga de agua tratada cerca de estero". +50 ecopuntos',
    timeAgo: 'Hace 2 dias',
    read: true,
  },
];

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
    default:
      return { name: 'ellipse', color: COLORS.textTertiary, bg: '#F3F4F6' };
  }
}

function getAvatarColor(name: string): string {
  const greens = ['#1D9E75', '#16a34a', '#15803d', '#0d9488', '#059669', '#047857'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return greens[Math.abs(hash) % greens.length];
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
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

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
          <Pressable style={styles.markReadBtn}>
            <Text style={styles.markReadText}>Marcar leidas</Text>
          </Pressable>
        </View>

        {/* Notifications list */}
        <FlatList
          data={MOCK_NOTIFICATIONS}
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
                  <View style={[styles.notifAvatar, { backgroundColor: getAvatarColor(item.userName) }]}>
                    <Text style={styles.notifAvatarText}>{item.userInitials}</Text>
                  </View>
                  <View style={[styles.notifIconBadge, { backgroundColor: icon.bg }]}>
                    <Ionicons name={icon.name as any} size={12} color={icon.color} />
                  </View>
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifMessage}>
                    <Text style={styles.notifUserName}>{item.userName}</Text>
                    {' '}{item.message}
                  </Text>
                  <Text style={styles.notifTime}>{item.timeAgo}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </Pressable>
            );
          }}
        />
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
  notifAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifAvatarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  notifIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  notifContent: {
    flex: 1,
  },
  notifMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  notifUserName: {
    fontWeight: '700',
    color: COLORS.textPrimary,
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
});
