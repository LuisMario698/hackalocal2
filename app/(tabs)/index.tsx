import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Text from '../../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeedList from '../../components/feed/FeedList';
import CommentsSheet from '../../components/feed/CommentsSheet';
import ReportDetail from '../../components/feed/ReportDetail';
import SearchSheet from '../../components/feed/SearchSheet';
import NotificationsSheet from '../../components/feed/NotificationsSheet';
import CreatePostSheet from '../../components/feed/CreatePostSheet';
import { CommentData, ReportData } from '../../components/feed/FeedCard';
import { PostData } from '../../components/feed/PostCard';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const PRIMARY = '#1D9E75';
const FILTERS = ['Todos', 'Recientes', 'Cercanos', 'Mas apoyados'];
const FILTER_KEYS = ['todos', 'recientes', 'cercanos', 'apoyados'];

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `Hace ${diffWeeks} semana${diffWeeks > 1 ? 's' : ''}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Feed state
  const [reports, setReports] = useState<ReportData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create post
  const [createPostVisible, setCreatePostVisible] = useState(false);

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        profiles ( name, avatar_url ),
        report_comments ( id, content, created_at, user_id, profiles ( name ) )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Error fetching reports:', error.message);
      return;
    }

    const mapped: ReportData[] = (data ?? []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.profiles?.name ?? 'Usuario',
      userInitials: getInitials(r.profiles?.name ?? 'U'),
      timeAgo: formatTimeAgo(r.created_at),
      category: r.category,
      status: r.status,
      title: r.title,
      description: r.description ?? '',
      location: r.address ?? '',
      photoUrl: r.photo_url ?? undefined,
      likesCount: r.likes_count ?? 0,
      commentsCount: r.comments_count ?? 0,
      severity: r.severity ?? 1,
      initialComments: (r.report_comments ?? [])
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((c: any) => ({
          id: c.id,
          userName: c.profiles?.name ?? 'Usuario',
          userInitials: getInitials(c.profiles?.name ?? 'U'),
          text: c.content,
          timeAgo: formatTimeAgo(c.created_at),
        })),
    }));

    setReports(mapped);
  }, []);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('feed_posts')
      .select(`
        *,
        profiles!feed_posts_user_id_fkey ( name, avatar_url ),
        feed_post_comments ( id, content, created_at, user_id, profiles!feed_post_comments_user_id_fkey ( name ) )
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('Error fetching posts:', error.message);
      console.error('Details:', error);
      return;
    }

    console.log('Posts fetched:', data?.length ?? 0, 'items');
    console.log('Posts data:', data);

    const mapped: PostData[] = (data ?? []).map((p: any) => ({
      id: p.id,
      userName: p.profiles?.name ?? 'Usuario',
      userInitials: getInitials(p.profiles?.name ?? 'U'),
      timeAgo: formatTimeAgo(p.created_at),
      type: p.type,
      priority: p.priority,
      title: p.title,
      content: p.content ?? '',
      isPinned: p.is_pinned,
      likesCount: p.likes_count ?? 0,
      commentsCount: p.comments_count ?? 0,
      photoUrl: p.photo_url ?? undefined,
      initialComments: (p.feed_post_comments ?? [])
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((c: any) => ({
          id: c.id,
          userName: c.profiles?.name ?? 'Usuario',
          userInitials: getInitials(c.profiles?.name ?? 'U'),
          text: c.content,
          timeAgo: formatTimeAgo(c.created_at),
        })),
    }));

    setPosts(mapped);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchReports(), fetchPosts()]).finally(() => setLoading(false));
  }, [fetchReports, fetchPosts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchReports(), fetchPosts()]).finally(() => setRefreshing(false));
  }, [fetchReports, fetchPosts]);

  // Create post handler
  const handleCreatePost = useCallback(async (data: { title: string; content: string; type: string }) => {
    const userId = user?.id;
    if (!userId) {
      Alert.alert('Error', 'Debes iniciar sesion para publicar');
      return;
    }

    const { error } = await supabase.from('feed_posts').insert({
      user_id: userId,
      title: data.title,
      content: data.content,
      type: data.type,
      priority: 'normal',
    } as any);

    if (error) {
      Alert.alert('Error', 'No se pudo crear la publicacion');
      throw error;
    }

    await fetchPosts();
  }, [user, fetchPosts]);

  // Solicitar report handler
  const handleSolicitarReport = useCallback((report: ReportData) => {
    Alert.alert(
      'Solicitud enviada',
      `Has solicitado atender el reporte "${report.title}". El autor sera notificado.`,
      [{ text: 'OK' }]
    );
  }, []);

  // Completar report handler (placeholder para funcionalidad futura)
  const handleCompletarReport = useCallback((report: ReportData) => {
    Alert.alert(
      'Completar reporte',
      `¿Confirmas que el problema "${report.title}" ha sido resuelto?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => {
          Alert.alert('Gracias', 'Tu confirmacion ha sido registrada. Un verificador revisara el reporte.');
        }},
      ]
    );
  }, []);

  // Comments sheet state
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [commentsReport, setCommentsReport] = useState<ReportData | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentData[]>>({});

  // Report detail state
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailReport, setDetailReport] = useState<ReportData | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});

  // Search state
  const [searchVisible, setSearchVisible] = useState(false);

  // Notifications state
  const [notifsVisible, setNotifsVisible] = useState(false);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);
    if (!error && count !== null) setUnreadNotifsCount(count);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleCloseNotifs = useCallback(() => {
    setNotifsVisible(false);
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // -- Comments handlers --
  const handleOpenComments = useCallback((report: ReportData) => {
    setCommentsReport(report);
    setCommentsMap((prev) => {
      if (!prev[report.id]) {
        return { ...prev, [report.id]: report.initialComments || [] };
      }
      return prev;
    });
    setCommentsVisible(true);
  }, []);

  const handleOpenPostComments = useCallback((post: PostData) => {
    const pseudoReport: ReportData = {
      id: `post-${post.id}`,
      userName: post.userName,
      userInitials: post.userInitials,
      timeAgo: post.timeAgo,
      category: 'other',
      status: 'pending',
      title: post.title,
      description: post.content,
      location: '',
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      severity: 1,
      initialComments: post.initialComments,
    };
    setCommentsReport(pseudoReport);
    setCommentsMap((prev) => {
      if (!prev[pseudoReport.id]) {
        return { ...prev, [pseudoReport.id]: post.initialComments || [] };
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
      if (!commentsReport) return;
      const newComment: CommentData = {
        id: Date.now().toString(),
        userName: profile?.name ?? 'Tu',
        userInitials: getInitials(profile?.name ?? 'Tu'),
        text,
        timeAgo: 'Ahora',
      };
      setCommentsMap((prev) => ({
        ...prev,
        [commentsReport.id]: [...(prev[commentsReport.id] || []), newComment],
      }));
    },
    [commentsReport, profile]
  );

  // -- Detail handlers --
  const handlePressReport = useCallback((report: ReportData) => {
    setDetailReport(report);
    setCommentsMap((prev) => {
      if (!prev[report.id]) {
        return { ...prev, [report.id]: report.initialComments || [] };
      }
      return prev;
    });
    if (likesMap[report.id] === undefined) {
      setLikesMap((prev) => ({ ...prev, [report.id]: report.likesCount }));
    }
    setDetailVisible(true);
  }, [likesMap]);

  const handleCloseDetail = useCallback(() => {
    setDetailVisible(false);
  }, []);

  const handleDetailLike = useCallback(() => {
    if (!detailReport) return;
    const id = detailReport.id;
    setLikedMap((prev) => {
      const wasLiked = prev[id] || false;
      setLikesMap((lp) => ({
        ...lp,
        [id]: (lp[id] ?? detailReport.likesCount) + (wasLiked ? -1 : 1),
      }));
      return { ...prev, [id]: !wasLiked };
    });
  }, [detailReport]);

  const handleDetailAddComment = useCallback(
    (text: string) => {
      if (!detailReport) return;
      const newComment: CommentData = {
        id: Date.now().toString(),
        userName: profile?.name ?? 'Tu',
        userInitials: getInitials(profile?.name ?? 'Tu'),
        text,
        timeAgo: 'Ahora',
      };
      setCommentsMap((prev) => ({
        ...prev,
        [detailReport.id]: [...(prev[detailReport.id] || []), newComment],
      }));
    },
    [detailReport, profile]
  );

  // -- Search handler --
  const handleSearchSelect = useCallback((report: ReportData) => {
    setSearchVisible(false);
    setTimeout(() => {
      handlePressReport(report);
    }, 300);
  }, [handlePressReport]);

  const activeComments = commentsReport ? commentsMap[commentsReport.id] || [] : [];
  const detailComments = detailReport ? commentsMap[detailReport.id] || [] : [];

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
            <Pressable style={styles.iconButton} onPress={() => setSearchVisible(true)}>
              <Ionicons name="search-outline" size={22} color="#1A1D21" />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setNotifsVisible(true)}>
              {unreadNotifsCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifsCount > 99 ? '99+' : unreadNotifsCount}
                  </Text>
                </View>
              )}
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
        reports={reports}
        posts={posts}
        loading={loading}
        filter={FILTER_KEYS[activeFilter]}
        onOpenComments={handleOpenComments}
        onPressReport={handlePressReport}
        onOpenPostComments={handleOpenPostComments}
        onSolicitarReport={handleSolicitarReport}
        onCompletarReport={handleCompletarReport}
        currentUserId={user?.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {/* FAB: Create Post */}
      <Pressable
        style={[styles.fab, { bottom: 100 + insets.bottom }]}
        onPress={() => setCreatePostVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>

      {/* Create Post Sheet */}
      <CreatePostSheet
        visible={createPostVisible}
        onClose={() => setCreatePostVisible(false)}
        onSubmit={handleCreatePost}
      />

      {/* Comments Bottom Sheet */}
      <CommentsSheet
        visible={commentsVisible}
        comments={activeComments}
        reportTitle={commentsReport?.title || ''}
        onClose={handleCloseComments}
        onAddComment={handleAddComment}
      />

      {/* Report Detail */}
      <ReportDetail
        visible={detailVisible}
        report={detailReport}
        comments={detailComments}
        onClose={handleCloseDetail}
        onAddComment={handleDetailAddComment}
        onLikeToggle={handleDetailLike}
        liked={detailReport ? likedMap[detailReport.id] || false : false}
        likesCount={
          detailReport
            ? likesMap[detailReport.id] ?? detailReport.likesCount
            : 0
        }
      />

      {/* Search */}
      <SearchSheet
        visible={searchVisible}
        reports={reports}
        onClose={() => setSearchVisible(false)}
        onSelectReport={handleSearchSelect}
      />

      {/* Notifications */}
      <NotificationsSheet
        visible={notifsVisible}
        onClose={handleCloseNotifs}
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
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
  },
});
