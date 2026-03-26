import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Text from '../ScaledText';
import { Ionicons } from '@expo/vector-icons';
import FeedCard, { ReportData } from './FeedCard';
import PostCard, { PostData } from './PostCard';
import AdBanner, { AdData, SAMPLE_ADS } from './AdBanner';

// Unified feed item type
export type FeedItem =
  | { kind: 'report'; data: ReportData }
  | { kind: 'post'; data: PostData }
  | { kind: 'ad'; data: AdData };

interface FeedListProps {
  reports: ReportData[];
  posts: PostData[];
  loading: boolean;
  filter: string;
  onOpenComments: (report: ReportData) => void;
  onPressReport: (report: ReportData) => void;
  onOpenPostComments?: (post: PostData) => void;
  onPressPost?: (post: PostData) => void;
  onSolicitarReport?: (report: ReportData) => void;
  currentUserId?: string;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function FeedList({
  reports,
  posts,
  loading,
  filter,
  onOpenComments,
  onPressReport,
  onOpenPostComments,
  onPressPost,
  onSolicitarReport,
  currentUserId,
  refreshing,
  onRefresh,
}: FeedListProps) {
  // Build unified feed: interleave reports, posts, and ads
  const feedItems: FeedItem[] = React.useMemo(() => {
    console.log('Building feed with', reports.length, 'reports and', posts.length, 'posts');
    let filteredReports = [...reports];
    if (filter === 'apoyados') {
      filteredReports.sort((a, b) => b.likesCount - a.likesCount);
    }

    // Pinned posts go first
    const pinnedPosts = posts.filter((p) => p.isPinned);
    const normalPosts = posts.filter((p) => !p.isPinned);
    console.log('Pinned:', pinnedPosts.length, 'Normal:', normalPosts.length);

    const items: FeedItem[] = [];

    // Add pinned posts first
    for (const p of pinnedPosts) {
      items.push({ kind: 'post', data: p });
    }

    // Interleave: every 3 reports, insert a post or ad
    let postIdx = 0;
    let adIdx = 0;
    for (let i = 0; i < filteredReports.length; i++) {
      items.push({ kind: 'report', data: filteredReports[i] });

      if ((i + 1) % 3 === 0) {
        // Alternate between post and ad
        if (postIdx < normalPosts.length) {
          items.push({ kind: 'post', data: normalPosts[postIdx] });
          postIdx++;
        } else if (adIdx < SAMPLE_ADS.length) {
          items.push({ kind: 'ad', data: SAMPLE_ADS[adIdx] });
          adIdx++;
        }
      }
    }

    // Add remaining posts
    while (postIdx < normalPosts.length) {
      items.push({ kind: 'post', data: normalPosts[postIdx] });
      postIdx++;
    }

    // Add remaining ads at the end if not yet shown
    while (adIdx < SAMPLE_ADS.length) {
      items.push({ kind: 'ad', data: SAMPLE_ADS[adIdx] });
      adIdx++;
    }

    return items;
  }, [filter, reports, posts]);

  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => {
      switch (item.kind) {
        case 'report':
          return (
            <FeedCard
              report={item.data}
              onOpenComments={onOpenComments}
              onPress={onPressReport}
              onSolicitar={onSolicitarReport}
              isOwnReport={currentUserId ? item.data.userId === currentUserId : false}
            />
          );
        case 'post':
          return (
            <PostCard
              post={item.data}
              onOpenComments={onOpenPostComments ? () => onOpenPostComments(item.data) : undefined}
              onPress={onPressPost ? () => onPressPost(item.data) : undefined}
            />
          );
        case 'ad':
          return <AdBanner ad={item.data} />;
      }
    },
    [onOpenComments, onPressReport, onOpenPostComments, onPressPost, onSolicitarReport, currentUserId]
  );

  const keyExtractor = useCallback((item: FeedItem) => {
    return `${item.kind}-${item.data.id}`;
  }, []);

  const isEmpty = reports.length === 0 && posts.length === 0;

  if (loading && isEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator size="large" color="#1D9E75" />
      </View>
    );
  }

  if (!loading && isEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="leaf-outline" size={56} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Sin publicaciones aun</Text>
        <Text style={styles.emptySubtitle}>
          Se el primero en reportar un problema o publicar en la comunidad
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={feedItems}
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
