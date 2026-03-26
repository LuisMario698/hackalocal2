import { View, StyleSheet } from 'react-native';
import Text from './ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import type { Badge } from '../constants/Gamification';

interface BadgeCardProps {
  badge: Badge;
  unlocked: boolean;
}

export default function BadgeCard({ badge, unlocked }: BadgeCardProps) {
  const C = useColors();
  const styles = makeStyles(C);
  return (
    <View style={[styles.container, !unlocked && styles.locked]}>
      <View style={[styles.iconWrap, !unlocked && styles.iconLocked]}>
        <Ionicons name={badge.icon as any} size={26} color={unlocked ? C.gold : C.textMuted} />
      </View>
      <Text style={[styles.name, !unlocked && styles.nameLocked]} numberOfLines={1}>
        {badge.name}
      </Text>
      {unlocked ? (
        <Ionicons name="checkmark-circle" size={16} color={C.success} />
      ) : (
        <Text style={styles.requirement} numberOfLines={2}>
          {badge.requirement}
        </Text>
      )}
    </View>
  );
}

const makeStyles = (C: any) => StyleSheet.create({
  container: {
    width: 100,
    alignItems: 'center',
    backgroundColor: C.surface,
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
    borderColor: C.gold,
  },
  locked: {
    borderColor: C.borderLight,
    opacity: 0.6,
  },
  iconWrap: {
    marginBottom: 6,
  },
  iconLocked: {
    opacity: 0.4,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  nameLocked: {
    color: C.textMuted,
  },
  requirement: {
    fontSize: 9,
    color: C.textMuted,
    textAlign: 'center',
  },
});
