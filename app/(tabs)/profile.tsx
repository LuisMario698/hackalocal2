import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BADGES, getUserLevel } from '../../constants/Gamification';
import { CURRENT_USER, LEADERBOARD, USER_HISTORY } from '../../constants/MockData';
import LevelBar from '../../components/LevelBar';
import BadgeCard from '../../components/BadgeCard';

const ACTION_ICONS: Record<string, string> = {
  report: '📍',
  task: '🧹',
  event: '🎪',
  verify: '✅',
  redeem: '🎁',
};

export default function ProfileScreen() {
  const user = CURRENT_USER;
  const level = getUserLevel(user.ecoPoints);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userRole}>
          {level.icon} {level.name} · Nivel {level.level}
        </Text>
      </View>

      {/* ===== BARRA DE NIVEL ===== */}
      <LevelBar points={user.ecoPoints} />

      {/* ===== STATS ===== */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{user.reportsCount}</Text>
          <Text style={styles.statLabel}>Reportes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{user.tasksCompleted}</Text>
          <Text style={styles.statLabel}>Limpiezas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{user.kgRecycled}</Text>
          <Text style={styles.statLabel}>Kg reciclados</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{user.streakDays}🔥</Text>
          <Text style={styles.statLabel}>Racha</Text>
        </View>
      </View>

      {/* ===== MEDALLAS ===== */}
      <Text style={styles.sectionTitle}>Medallas</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
        {BADGES.map(badge => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            unlocked={user.unlockedBadges.includes(badge.id)}
          />
        ))}
      </ScrollView>

      {/* ===== LEADERBOARD ===== */}
      <Text style={styles.sectionTitle}>Leaderboard del mes</Text>
      <View style={styles.leaderboardCard}>
        {LEADERBOARD.map(entry => {
          const isMe = entry.userId === user.id;
          const medal =
            entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
          return (
            <View
              key={entry.userId}
              style={[styles.leaderRow, isMe && styles.leaderRowMe]}
            >
              <Text style={styles.leaderRank}>{medal}</Text>
              <Text style={[styles.leaderName, isMe && styles.leaderNameMe]} numberOfLines={1}>
                {entry.name}
              </Text>
              <Text style={styles.leaderPts}>{entry.ecoPoints} pts</Text>
            </View>
          );
        })}
      </View>

      {/* ===== HISTORIAL ===== */}
      <Text style={styles.sectionTitle}>Actividad reciente</Text>
      <View style={styles.historyCard}>
        {USER_HISTORY.map(action => (
          <View key={action.id} style={styles.historyRow}>
            <Text style={styles.historyIcon}>{ACTION_ICONS[action.type] ?? '📌'}</Text>
            <View style={styles.historyInfo}>
              <Text style={styles.historyDesc} numberOfLines={1}>{action.description}</Text>
              <Text style={styles.historyDate}>{action.date}</Text>
            </View>
            <Text style={[styles.historyPts, action.points < 0 && styles.historyPtsNeg]}>
              {action.points > 0 ? '+' : ''}{action.points}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  userRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },

  // Badges
  badgesScroll: {
    marginBottom: 20,
  },

  // Leaderboard
  leaderboardCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  leaderRowMe: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  leaderRank: {
    fontSize: 16,
    width: 36,
    textAlign: 'center',
  },
  leaderName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 4,
  },
  leaderNameMe: {
    fontWeight: '700',
    color: Colors.primary,
  },
  leaderPts: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // History
  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  historyIcon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 8,
  },
  historyDesc: {
    fontSize: 13,
    color: Colors.text,
  },
  historyDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyPts: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  historyPtsNeg: {
    color: Colors.accent,
  },
});
