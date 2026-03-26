import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { LEARN_DATA, type LearnItem } from '../../constants/LearnData';
import LearnVideoCard from '../../components/learn/LearnVideoCard';
import LearnArticleCard from '../../components/learn/LearnArticleCard';
import { useColors } from '../../contexts/ThemeContext';

export default function AprendeScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const styles = makeStyles(C);

  const renderItem = ({ item }: { item: LearnItem }) => {
    if (item.type === 'video') {
      return <LearnVideoCard item={item} />;
    }
    return <LearnArticleCard item={item} />;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={LEARN_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Aprende</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>BETA</Text>
                </View>
              </View>
              <View style={styles.iconCircle}>
                <Ionicons name="leaf" size={24} color={C.primary} />
              </View>
            </View>
            <Text style={styles.subtitle}>
              Educación ambiental al alcance de tu mano. Explora videos rápidos y documentos oficiales para cambiar el mundo.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (C: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  listContent: {
    padding: 20,
  },
  header: {
    marginBottom: 28,
    backgroundColor: C.surface,
    padding: 24,
    borderRadius: 24,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: C.primary + '1A',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  badgeText: {
    color: C.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: C.textSecondary,
    lineHeight: 24,
    fontWeight: '500',
  },
});
