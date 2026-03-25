import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import type { Badge } from '../constants/Gamification';

interface BadgeCardProps {
  badge: Badge;
  unlocked: boolean;
}

export default function BadgeCard({ badge, unlocked }: BadgeCardProps) {
  return (
    <View style={[styles.container, !unlocked && styles.locked]}>
      <Text style={[styles.icon, !unlocked && styles.iconLocked]}>
        {badge.icon}
      </Text>
      <Text style={[styles.name, !unlocked && styles.nameLocked]} numberOfLines={1}>
        {badge.name}
      </Text>
      {unlocked ? (
        <Text style={styles.check}>✓</Text>
      ) : (
        <Text style={styles.requirement} numberOfLines={2}>
          {badge.requirement}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  locked: {
    borderColor: Colors.borderLight,
    opacity: 0.6,
  },
  icon: {
    fontSize: 28,
    marginBottom: 6,
  },
  iconLocked: {
    opacity: 0.4,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  nameLocked: {
    color: Colors.textMuted,
  },
  check: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '700',
  },
  requirement: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
