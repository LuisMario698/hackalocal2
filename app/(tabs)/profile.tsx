import { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { BADGES, getUserLevel, getLevelProgress, getNextLevel } from '../../constants/Gamification';
import { CURRENT_USER, LEADERBOARD, USER_HISTORY } from '../../constants/MockData';
import BadgeCard from '../../components/BadgeCard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  report: 'location-outline',
  task: 'leaf-outline',
  event: 'calendar-outline',
  verify: 'checkmark-circle-outline',
  redeem: 'gift-outline',
};

type SectionId = 'badges' | 'leaderboard' | 'history';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  expanded: boolean;
  onPress: () => void;
  children: React.ReactNode;
  accentColor?: string;
}

function MenuItem({ icon, label, subtitle, expanded, onPress, children, accentColor }: MenuItemProps) {
  return (
    <View style={s.menuItem}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [s.menuRow, pressed && s.menuRowPressed]}
      >
        <View style={[s.menuIconBox, { backgroundColor: accentColor ?? Colors.primaryLight }]}>  
          <Ionicons name={icon} size={20} color={accentColor ? '#fff' : Colors.primary} />
        </View>
        <View style={s.menuTextWrap}>
          <Text style={s.menuLabel}>{label}</Text>
          {subtitle && <Text style={s.menuSubtitle}>{subtitle}</Text>}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.textMuted}
        />
      </Pressable>
      {expanded && <View style={s.menuContent}>{children}</View>}
    </View>
  );
}

export default function ProfileScreen() {
  const user = CURRENT_USER;
  const level = getUserLevel(user.ecoPoints);
  const progress = getLevelProgress(user.ecoPoints);
  const next = getNextLevel(user.ecoPoints);

  const router = useRouter();
  const [openSection, setOpenSection] = useState<SectionId | null>(null);

  const toggle = (id: SectionId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSection(prev => (prev === id ? null : id));
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      {/* ===== HEADER UBER-STYLE ===== */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>
              {user.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={s.headerInfo}>
            <Text style={s.userName}>{user.name}</Text>
            <Text style={s.userLevel}>
              {level.name}
            </Text>
          </View>
          <View style={s.pointsBadge}>
            <Text style={s.pointsValue}>{user.ecoPoints}</Text>
            <Text style={s.pointsLabel}>pts</Text>
          </View>
        </View>

        {/* Mini progress bar */}
        <View style={s.miniBarBg}>
          <View style={[s.miniBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={s.miniBarText}>
          {next
            ? `${next.minPoints - user.ecoPoints} pts para ${next.name}`
            : 'Nivel maximo alcanzado'}
        </Text>
      </View>

      {/* ===== STATS ROW (siempre visible) ===== */}
      <View style={s.statsRow}>
        {[
          { val: user.reportsCount, label: 'Reportes', icon: 'location-outline' as const },
          { val: user.tasksCompleted, label: 'Limpiezas', icon: 'leaf-outline' as const },
          { val: `${user.kgRecycled}`, label: 'Kg reciclados', icon: 'refresh-outline' as const },
          { val: `${user.streakDays}`, label: 'Racha', icon: 'flame-outline' as const },
        ].map(stat => (
          <View key={stat.label} style={s.statBox}>
            <Ionicons name={stat.icon} size={16} color={Colors.primary} style={{ marginBottom: 4 }} />
            <Text style={s.statValue}>{stat.val}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ===== MENU SECCIONES ===== */}
      <MenuItem
        icon="trophy"
        label="Medallas"
        subtitle={`${user.unlockedBadges.length} de ${BADGES.length} desbloqueadas`}
        expanded={openSection === 'badges'}
        onPress={() => toggle('badges')}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {BADGES.map(badge => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              unlocked={user.unlockedBadges.includes(badge.id)}
            />
          ))}
        </ScrollView>
      </MenuItem>

      <MenuItem
        icon="podium"
        label="Leaderboard"
        subtitle="Top 10 del mes"
        expanded={openSection === 'leaderboard'}
        onPress={() => toggle('leaderboard')}
      >
        {LEADERBOARD.map(entry => {
          const isMe = entry.userId === user.id;
          return (
            <View key={entry.userId} style={[s.leaderRow, isMe && s.leaderRowMe]}>
              <Text style={[
                s.leaderRank,
                entry.rank <= 3 && { color: entry.rank === 1 ? Colors.gold : entry.rank === 2 ? Colors.silver : Colors.bronze, fontWeight: '800' },
              ]}>#{entry.rank}</Text>
              <Text style={[s.leaderName, isMe && s.leaderNameMe]} numberOfLines={1}>
                {entry.name}
              </Text>
              <Text style={s.leaderPts}>{entry.ecoPoints} pts</Text>
            </View>
          );
        })}
      </MenuItem>

      <MenuItem
        icon="time"
        label="Actividad reciente"
        subtitle={`${USER_HISTORY.length} acciones`}
        expanded={openSection === 'history'}
        onPress={() => toggle('history')}
      >
        {USER_HISTORY.map(action => (
          <View key={action.id} style={s.historyRow}>
            <View style={s.historyIconWrap}>
              <Ionicons name={ACTION_ICONS[action.type] ?? 'ellipse'} size={16} color={Colors.primary} />
            </View>
            <View style={s.historyInfo}>
              <Text style={s.historyDesc} numberOfLines={1}>{action.description}</Text>
              <Text style={s.historyDate}>{action.date}</Text>
            </View>
            <Text style={[s.historyPts, action.points < 0 && s.historyPtsNeg]}>
              {action.points > 0 ? '+' : ''}{action.points}
            </Text>
          </View>
        ))}
      </MenuItem>

      {/* Boton configuracion */}
      <Pressable
        onPress={() => router.push('/settings' as any)}
        style={s.settingsRow}
      >
        <View style={s.settingsRowIcon}>
          <Ionicons name="settings-outline" size={20} color={Colors.primary} />
        </View>
        <Text style={s.settingsRowLabel}>Configuracion</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </Pressable>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },

  // ===== Header =====
  header: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 20, fontWeight: '700', color: Colors.text },
  userLevel: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  pointsBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pointsValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  pointsLabel: { fontSize: 10, color: Colors.primary, fontWeight: '600' },

  miniBarBg: {
    height: 6,
    backgroundColor: Colors.xpBarBg,
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: Colors.xpBar,
    borderRadius: 3,
  },
  miniBarText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: 'right',
  },

  // ===== Stats =====
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 3 },

  // ===== Menu items =====
  menuItem: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuRowPressed: { backgroundColor: Colors.borderLight },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1, marginLeft: 14 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  menuSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  menuContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },

  // ===== Leaderboard =====
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  leaderRowMe: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    borderBottomWidth: 0,
    paddingHorizontal: 8,
  },
  leaderRank: { fontSize: 15, width: 34, textAlign: 'center' },
  leaderName: { flex: 1, fontSize: 13, color: Colors.text, marginLeft: 4 },
  leaderNameMe: { fontWeight: '700', color: Colors.primary },
  leaderPts: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  // ===== History =====
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  historyIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: { flex: 1, marginLeft: 8 },
  historyDesc: { fontSize: 12, color: Colors.text },
  historyDate: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  historyPts: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  historyPtsNeg: { color: Colors.accent },

  // ===== Settings row (bottom) =====
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  settingsRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
});
