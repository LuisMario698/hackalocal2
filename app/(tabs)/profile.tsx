import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from 'react-native';
import Text from '../../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '../../contexts/ThemeContext';
import { BADGES, getUserLevel, getLevelProgress, getNextLevel } from '../../constants/Gamification';
import BadgeCard from '../../components/BadgeCard';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  ecoPoints: number;
  level: number;
}

interface ActionHistory {
  id: string;
  type: 'report' | 'task' | 'event' | 'verify' | 'redeem';
  description: string;
  points: number;
  date: string;
}

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
  const C = useColors();
  const s = makeS(C);
  return (
    <View style={s.menuItem}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [s.menuRow, pressed && s.menuRowPressed]}
      >
        <View style={[s.menuIconBox, { backgroundColor: accentColor ?? C.primaryLight }]}>  
          <Ionicons name={icon} size={20} color={accentColor ? '#fff' : C.primary} />
        </View>
        <View style={s.menuTextWrap}>
          <Text style={s.menuLabel}>{label}</Text>
          {subtitle && <Text style={s.menuSubtitle}>{subtitle}</Text>}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={C.textMuted}
        />
      </Pressable>
      {expanded && <View style={s.menuContent}>{children}</View>}
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const router = useRouter();
  const C = useColors();
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<ActionHistory[]>([]);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);

  const avatarUrl = profile?.avatar_url;

  // Derived from real profile or fallback
  const userName = profile?.name ?? user?.user_metadata?.name ?? 'Usuario';
  const ecoPoints = profile?.eco_points ?? 0;
  const reportsCount = profile?.reports_count ?? 0;
  const tasksCompleted = profile?.tasks_completed ?? 0;
  const streakDays = profile?.streak_days ?? 0;

  const level = getUserLevel(ecoPoints);
  const progress = getLevelProgress(ecoPoints);
  const next = getNextLevel(ecoPoints);

  // Fetch leaderboard from DB
  const fetchLeaderboard = useCallback(async () => {
    const month = new Date().toISOString().slice(0, 7); // '2026-03'
    const { data } = await supabase
      .from('leaderboard_monthly')
      .select('user_id, points, profiles(name)')
      .eq('year_month', month)
      .order('points', { ascending: false })
      .limit(10) as any;

    if (data && data.length > 0) {
      setLeaderboard(data.map((row: any, i: number) => ({
        rank: i + 1,
        userId: row.user_id,
        name: row.profiles?.name ?? 'Anonimo',
        ecoPoints: row.points,
        level: 1,
      })));
    }
  }, []);

  // Fetch points history from DB
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('points_history')
      .select('id, points, action, reference_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20) as any;

    if (data && data.length > 0) {
      const typeMap: Record<string, ActionHistory['type']> = {
        report_verified: 'report',
        report_verification: 'verify',
        service_completed: 'task',
        reward_claimed: 'redeem',
      };
      setHistory(data.map((row: any) => ({
        id: row.id,
        type: typeMap[row.action] ?? 'report',
        description: row.action.replace(/_/g, ' '),
        points: row.points,
        date: new Date(row.created_at).toISOString().slice(0, 10),
      })));
    }
  }, [user]);

  // Fetch user badges from DB + compute locally from profile stats
  const fetchBadges = useCallback(async () => {
    const unlocked = new Set<string>();

    // 1) Check from DB (user_badges table)
    if (user) {
      const { data } = await supabase
        .from('user_badges')
        .select('badge_id, badges(name)')
        .eq('user_id', user.id) as any;

      if (data && data.length > 0) {
        for (const row of data) {
          const dbName: string = row.badges?.name ?? '';
          // Match DB badge name → BADGES constant id
          const match = BADGES.find(b => b.name === dbName);
          if (match) unlocked.add(match.id);
        }
      }
    }

    // 2) Local fallback: compute from profile stats so badges light up even if DB function hasn't run
    if (profile) {
      if ((profile.reports_count ?? 0) >= 1) unlocked.add('first_report');
      if ((profile.tasks_completed ?? 0) >= 1) unlocked.add('cleaner_novice');
      if ((profile.tasks_completed ?? 0) >= 5) unlocked.add('five_stars');
      if ((profile.streak_days ?? 0) >= 7) unlocked.add('weekly_streak');
      if ((profile.tasks_completed ?? 0) >= 10) unlocked.add('beach_guardian');
      if ((profile.eco_points ?? 0) >= 500) unlocked.add('top_10');
      if (getUserLevel(profile.eco_points ?? 0).level >= 5) unlocked.add('eco_hero');
    }

    setUnlockedBadgeIds(Array.from(unlocked));
  }, [user, profile]);

  useEffect(() => {
    fetchLeaderboard();
    fetchHistory();
    fetchBadges();
  }, [fetchLeaderboard, fetchHistory, fetchBadges]);

  const toggle = (id: SectionId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSection(prev => (prev === id ? null : id));
  };

  const s = makeS(C);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    router.replace('/login' as any);
  };

  return (
    <ScrollView style={[s.screen, { backgroundColor: C.background }]} contentContainerStyle={s.content}>
      {/* ===== HEADER UBER-STYLE ===== */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View style={s.avatarCircle}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl, cache: 'reload' }} style={s.avatarImage} />
            ) : (
              <Text style={s.avatarText}>
                {userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </Text>
            )}
          </View>
          <View style={s.headerInfo}>
            <Text style={s.userName}>{userName}</Text>
            <Text style={s.userLevel}>
              {level.name}
            </Text>
          </View>
          <View style={s.pointsBadge}>
            <Text style={s.pointsValue}>{ecoPoints}</Text>
            <Text style={s.pointsLabel}>pts</Text>
          </View>
        </View>

        {/* Mini progress bar */}
        <View style={s.miniBarBg}>
          <View style={[s.miniBarFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={s.miniBarText}>
          {next
            ? `${next.minPoints - ecoPoints} pts para ${next.name}`
            : 'Nivel maximo alcanzado'}
        </Text>
      </View>

      {/* ===== STATS ROW (siempre visible) ===== */}
      <View style={s.statsRow}>
        {[
          { val: reportsCount, label: 'Reportes', icon: 'location-outline' as const },
          { val: tasksCompleted, label: 'Limpiezas', icon: 'leaf-outline' as const },
          { val: `${streakDays}`, label: 'Racha', icon: 'flame-outline' as const },
        ].map(stat => (
          <View key={stat.label} style={s.statBox}>
            <Ionicons name={stat.icon} size={16} color={C.primary} style={{ marginBottom: 4 }} />
            <Text style={s.statValue}>{stat.val}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* ===== MENU SECCIONES ===== */}
      <MenuItem
        icon="trophy"
        label="Medallas"
        subtitle={`${unlockedBadgeIds.length} de ${BADGES.length} desbloqueadas`}
        expanded={openSection === 'badges'}
        onPress={() => toggle('badges')}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {BADGES.map(badge => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              unlocked={unlockedBadgeIds.includes(badge.id)}
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
        {leaderboard.map(entry => {
          const isMe = entry.userId === user?.id;
          return (
            <View key={entry.userId} style={[s.leaderRow, isMe && s.leaderRowMe]}>
              <Text style={[
                s.leaderRank,
                entry.rank <= 3 && { color: entry.rank === 1 ? C.gold : entry.rank === 2 ? C.silver : C.bronze, fontWeight: '800' },
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
        subtitle={`${history.length} acciones`}
        expanded={openSection === 'history'}
        onPress={() => toggle('history')}
      >
        {history.map(action => (
          <View key={action.id} style={s.historyRow}>
            <View style={s.historyIconWrap}>
              <Ionicons name={ACTION_ICONS[action.type] ?? 'ellipse'} size={16} color={C.primary} />
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
          <Ionicons name="settings-outline" size={20} color={C.primary} />
        </View>
        <Text style={s.settingsRowLabel}>Configuracion</Text>
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      </Pressable>

      {/* Boton cerrar sesion */}
      <Pressable onPress={handleLogout} style={[s.settingsRow, { marginTop: 8 }]}>
        <View style={[s.settingsRowIcon, { backgroundColor: '#fde8e8' }]}>
          <Ionicons name="log-out-outline" size={20} color="#d32f2f" />
        </View>
        <Text style={[s.settingsRowLabel, { color: '#d32f2f' }]}>Cerrar sesion</Text>
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      </Pressable>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const makeS = (C: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },

  // ===== Header =====
  header: {
    backgroundColor: C.surface,
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
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  headerInfo: { flex: 1, marginLeft: 14 },
  userName: { fontSize: 20, fontWeight: '700', color: C.text },
  userLevel: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  pointsBadge: {
    backgroundColor: C.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pointsValue: { fontSize: 18, fontWeight: '800', color: C.primary },
  pointsLabel: { fontSize: 10, color: C.primary, fontWeight: '600' },

  miniBarBg: {
    height: 6,
    backgroundColor: C.xpBarBg,
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: C.xpBar,
    borderRadius: 3,
  },
  miniBarText: {
    fontSize: 11,
    color: C.textMuted,
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
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 10, color: C.textMuted, marginTop: 3 },

  // ===== Menu items =====
  menuItem: {
    backgroundColor: C.surface,
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
  menuRowPressed: { backgroundColor: C.borderLight },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1, marginLeft: 14 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: C.text },
  menuSubtitle: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  menuContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    paddingTop: 12,
  },

  // ===== Leaderboard =====
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  leaderRowMe: {
    backgroundColor: C.primaryLight,
    borderRadius: 10,
    borderBottomWidth: 0,
    paddingHorizontal: 8,
  },
  leaderRank: { fontSize: 15, width: 34, textAlign: 'center' },
  leaderName: { flex: 1, fontSize: 13, color: C.text, marginLeft: 4 },
  leaderNameMe: { fontWeight: '700', color: C.primary },
  leaderPts: { fontSize: 12, fontWeight: '600', color: C.textSecondary },

  // ===== History =====
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  historyIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: { flex: 1, marginLeft: 8 },
  historyDesc: { fontSize: 12, color: C.text },
  historyDate: { fontSize: 10, color: C.textMuted, marginTop: 2 },
  historyPts: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  historyPtsNeg: { color: C.accent },

  // ===== Settings row (bottom) =====
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
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
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
  },
});
