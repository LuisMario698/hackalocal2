import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { getUserLevel, getLevelProgress, getNextLevel } from '../constants/Gamification';

interface LevelBarProps {
  points: number;
}

export default function LevelBar({ points }: LevelBarProps) {
  const level = getUserLevel(points);
  const progress = getLevelProgress(points);
  const next = getNextLevel(points);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelIconWrap}>
          <Ionicons name={level.icon as any} size={26} color={Colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.levelName}>{level.name}</Text>
          <Text style={styles.levelNumber}>Nivel {level.level}</Text>
        </View>
        <Text style={styles.points}>{points} pts</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>
      {next && (
        <Text style={styles.nextLabel}>
          {next.minPoints - points} pts para {next.name}
        </Text>
      )}
      {!next && (
        <Text style={styles.nextLabel}>Nivel maximo alcanzado</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  levelName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  levelNumber: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  points: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  barBg: {
    height: 10,
    backgroundColor: Colors.xpBarBg,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.xpBar,
    borderRadius: 5,
  },
  nextLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: 'right',
  },
});
