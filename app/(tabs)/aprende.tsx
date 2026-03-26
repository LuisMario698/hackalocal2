import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { LEARN_DATA, type LearnItem } from '../../constants/LearnData';
import LearnVideoCard from '../../components/learn/LearnVideoCard';
import LearnArticleCard from '../../components/learn/LearnArticleCard';

export default function AprendeScreen() {
  const insets = useSafeAreaInsets();

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
          { paddingBottom: insets.bottom + 100 }, // space for the floating tab bar
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
                <Ionicons name="leaf" size={24} color="#1D9E75" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6', // Lighter, cooler background
  },
  listContent: {
    padding: 20,
  },
  header: {
    marginBottom: 28,
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#1D9E75',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(29, 158, 117, 0.1)',
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
    color: '#111827',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: '#E1F5EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  badgeText: {
    color: '#1D9E75',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E1F5EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    fontWeight: '500',
  },
});
