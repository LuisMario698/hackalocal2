import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeedList from '../../components/feed/FeedList';
import CommentsSheet from '../../components/feed/CommentsSheet';
import { CommentData, ReportData } from '../../components/feed/FeedCard';

const PRIMARY = '#1D9E75';
const FILTERS = ['Todos', 'Recientes', 'Cercanos', 'Mas apoyados'];
const FILTER_KEYS = ['todos', 'recientes', 'cercanos', 'apoyados'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Comments sheet state
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activeReport, setActiveReport] = useState<ReportData | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentData[]>>({});

  const handleOpenComments = useCallback((report: ReportData) => {
    setActiveReport(report);
    // Initialize comments from mock data if not yet in map
    setCommentsMap((prev) => {
      if (!prev[report.id]) {
        return { ...prev, [report.id]: report.initialComments || [] };
      }
      return prev;
    });
    setCommentsVisible(true);
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentsVisible(false);
  }, []);

  const handleAddComment = useCallback(
    (text: string) => {
      if (!activeReport) return;
      const newComment: CommentData = {
        id: Date.now().toString(),
        userName: 'Tu',
        userInitials: 'TU',
        text,
        timeAgo: 'Ahora',
      };
      setCommentsMap((prev) => ({
        ...prev,
        [activeReport.id]: [...(prev[activeReport.id] || []), newComment],
      }));
    },
    [activeReport]
  );

  const activeComments = activeReport ? commentsMap[activeReport.id] || [] : [];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.97],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, opacity: headerOpacity },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Social Clean</Text>
            <Text style={styles.headerSubtitle}>Feed de la comunidad</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton}>
              <Ionicons name="search-outline" size={22} color="#1A1D21" />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>3</Text>
              </View>
              <Ionicons name="notifications-outline" size={22} color="#1A1D21" />
            </Pressable>
          </View>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTERS.map((label, index) => {
            const isActive = activeFilter === index;
            return (
              <Pressable
                key={label}
                onPress={() => setActiveFilter(index)}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Feed */}
      <FeedList
        filter={FILTER_KEYS[activeFilter]}
        onOpenComments={handleOpenComments}
      />

      {/* Comments Bottom Sheet */}
      <CommentsSheet
        visible={commentsVisible}
        comments={activeComments}
        reportTitle={activeReport?.title || ''}
        onClose={handleCloseComments}
        onAddComment={handleAddComment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E24B4A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filtersScroll: {
    maxHeight: 40,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  filterPillActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
});
