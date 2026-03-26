import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Text from '../ScaledText';
import { Ionicons } from '@expo/vector-icons';
import FeedCard, { ReportData } from './FeedCard';

interface FeedListProps {
  reports: ReportData[];
  loading: boolean;
  filter: string;
  onOpenComments: (report: ReportData) => void;
  onPressReport: (report: ReportData) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function FeedList({
  reports,
  loading,
  filter,
  onOpenComments,
  onPressReport,
  refreshing,
  onRefresh,
}: FeedListProps) {
  const filteredReports = React.useMemo(() => {
    if (filter === 'recientes') {
      return [...reports]; // already sorted by created_at desc from DB
    }
    if (filter === 'apoyados') {
      return [...reports].sort((a, b) => b.likesCount - a.likesCount);
    }
    return reports;
  }, [filter, reports]);

  const renderItem = useCallback(
    ({ item }: { item: ReportData }) => (
      <FeedCard report={item} onOpenComments={onOpenComments} onPress={onPressReport} />
    ),
    [onOpenComments, onPressReport]
  );

  const keyExtractor = useCallback((item: ReportData) => item.id, []);

  if (loading && reports.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  if (!loading && reports.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="leaf-outline" size={56} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Sin reportes aun</Text>
        <Text style={styles.emptySubtitle}>
          Se el primero en reportar un problema ambiental en tu comunidad
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredReports}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1D9E75']}
          tintColor="#1D9E75"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  separator: {
    height: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D21',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
