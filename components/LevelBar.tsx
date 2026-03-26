import { View, StyleSheet } from 'react-native';
import Text from './ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../contexts/ThemeContext';
import { getUserLevel, getLevelProgress, getNextLevel } from '../constants/Gamification';

interface LevelBarProps {
  points: number;
}

export default function LevelBar({ points }: LevelBarProps) {
  const C = useColors();
  const styles = makeStyles(C);
  const level = getUserLevel(points);
  const progress = getLevelProgress(points);
  const next = getNextLevel(points);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelIconWrap}>
          <Ionicons name={level.icon as any} size={26} color={C.primary} />
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

const makeStyles = (C: any) => StyleSheet.create({
  container: {
    backgroundColor: C.surface,
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
    backgroundColor: C.primaryLight,
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
    color: C.text,
  },
  levelNumber: {
    fontSize: 13,
    color: C.textSecondary,
  },
  points: {
    fontSize: 18,
    fontWeight: '700',
    color: C.primary,
  },
  barBg: {
    height: 10,
    backgroundColor: C.xpBarBg,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: C.xpBar,
    borderRadius: 5,
  },
  nextLabel: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 6,
    textAlign: 'right',
  },
});
