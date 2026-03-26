import { useState, useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Text from '../../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { REPORT_CATEGORIES } from '../../constants/Gamification';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// ─── Interfaces ──────────────────────────────────────────────
interface PendingReport {
  id: string;
  user_id: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  status: string;
  severity: number;
  latitude: number;
  longitude: number;
  address: string;
  photo_url: string | null;
  photo_after_url: string | null;
  attended_by: string | null;
  attendedByName: string;
  likes_count: number;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return formatDate(dateStr);
}

// ═════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═════════════════════════════════════════════════════════════
export default function VerifierTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Data state
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [resolutionReports, setResolutionReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'resolutions'>('pending');

  // Session stats
  const [sessionApproved, setSessionApproved] = useState(0);
  const [sessionRejected, setSessionRejected] = useState(0);
  const [sessionResolved, setSessionResolved] = useState(0);

  // Rejection reason state
  const [rejectingReportId, setRejectingReportId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // ─── Fetch pending reports from Supabase ────────────────────
  const fetchPendingReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }) as any;

      if (error) {
        console.warn('[Verify] Error:', error.message);
        return;
      }

      // Fetch reporter names separately to avoid join issues
      const mapped: PendingReport[] = (data ?? []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        userName: 'Usuario',
        title: r.title,
        description: r.description ?? '',
        category: r.category,
        status: r.status,
        severity: r.severity ?? 1,
        latitude: r.latitude,
        longitude: r.longitude,
        address: r.address ?? '',
        photo_url: r.photo_url,
        photo_after_url: r.photo_after_url ?? null,
        attended_by: r.attended_by ?? null,
        attendedByName: '',
        likes_count: r.likes_count ?? 0,
        created_at: r.created_at,
      }));

      // Enrich with profile names
      const userIds = [...new Set(mapped.map((r) => r.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds) as any;

        if (profiles) {
          const nameMap = new Map(profiles.map((p: any) => [p.id, p.name]));
          mapped.forEach((r) => {
            r.userName = (nameMap.get(r.user_id) as string) ?? 'Usuario';
          });
        }
      }

      setPendingReports(mapped);
    } catch (err: any) {
      console.warn('[Verify] Connection error:', err?.message);
    }
  }, []);

  // ─── Fetch resolution reports (in_progress with photo_after_url) ────
  const fetchResolutionReports = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('status', 'in_progress')
        .not('photo_after_url', 'is', null)
        .order('created_at', { ascending: false }) as any;

      if (error) {
        console.warn('[Verify] Resolution error:', error.message);
        return;
      }

      const mapped: PendingReport[] = (data ?? []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        userName: 'Usuario',
        title: r.title,
        description: r.description ?? '',
        category: r.category,
        status: r.status,
        severity: r.severity ?? 1,
        latitude: r.latitude,
        longitude: r.longitude,
        address: r.address ?? '',
        photo_url: r.photo_url,
        photo_after_url: r.photo_after_url ?? null,
        attended_by: r.attended_by ?? null,
        attendedByName: '',
        likes_count: r.likes_count ?? 0,
        created_at: r.created_at,
      }));

      // Enrich with profile names (reporter + attendee)
      const allIds = [...new Set([
        ...mapped.map((r) => r.user_id),
        ...mapped.filter((r) => r.attended_by).map((r) => r.attended_by!),
      ])];
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', allIds) as any;

        if (profiles) {
          const nameMap = new Map(profiles.map((p: any) => [p.id, p.name]));
          mapped.forEach((r) => {
            r.userName = (nameMap.get(r.user_id) as string) ?? 'Usuario';
            if (r.attended_by) {
              r.attendedByName = (nameMap.get(r.attended_by) as string) ?? 'Usuario';
            }
          });
        }
      }

      setResolutionReports(mapped);
    } catch (err: any) {
      console.warn('[Verify] Resolution connection error:', err?.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPendingReports(), fetchResolutionReports()]).finally(() => setLoading(false));

    // Realtime: listen for new pending reports and status changes
    const channel = supabase
      .channel('verify-reports')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
          filter: 'status=eq.pending',
        },
        async (payload: any) => {
          // Fetch the new report
          const { data } = await supabase
            .from('reports')
            .select('*')
            .eq('id', payload.new.id)
            .maybeSingle() as any;

          if (data) {
            // Get reporter name
            let userName = 'Usuario';
            const { data: prof } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', data.user_id)
              .maybeSingle() as any;
            if (prof) userName = prof.name;

            const newReport: PendingReport = {
              id: data.id,
              user_id: data.user_id,
              userName,
              title: data.title,
              description: data.description ?? '',
              category: data.category,
              status: data.status,
              severity: data.severity ?? 1,
              latitude: data.latitude,
              longitude: data.longitude,
              address: data.address ?? '',
              photo_url: data.photo_url,
              photo_after_url: data.photo_after_url ?? null,
              attended_by: data.attended_by ?? null,
              attendedByName: '',
              likes_count: data.likes_count ?? 0,
              created_at: data.created_at,
            };
            setPendingReports((prev) => {
              if (prev.some((r) => r.id === newReport.id)) return prev;
              return [newReport, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports',
        },
        (payload: any) => {
          // Remove reports that are no longer pending (verified/rejected by another verifier)
          if (payload.new.status !== 'pending') {
            setPendingReports((prev) => prev.filter((r) => r.id !== payload.new.id));
          }
          // If status changed to in_progress with photo_after_url, refresh resolutions
          if (payload.new.status === 'in_progress' && payload.new.photo_after_url) {
            fetchResolutionReports();
          }
          // If resolved/rejected, remove from resolutions
          if (payload.new.status === 'resolved' || payload.new.status === 'rejected') {
            setResolutionReports((prev) => prev.filter((r) => r.id !== payload.new.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingReports]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchPendingReports(), fetchResolutionReports()]).finally(() => setRefreshing(false));
  }, [fetchPendingReports, fetchResolutionReports]);

  // ─── Is own report check ────────────────────────────────────
  const isOwnReport = useCallback(
    (report: PendingReport) => report.user_id === user?.id,
    [user]
  );

  // ─── Verify (approve) a report ──────────────────────────────
  const handleVerify = useCallback(
    (report: PendingReport) => {
      if (isOwnReport(report)) {
        Alert.alert('No permitido', 'No puedes verificar tus propios reportes.');
        return;
      }
      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión para verificar reportes.');
        return;
      }

      Alert.alert(
        'Verificar reporte',
        `¿Aprobar "${report.title}"?\n\nEl reporte aparecerá en el feed y mapa público.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Aprobar',
            onPress: async () => {
              setActionLoading(report.id);
              try {
                // Try RPC first
                const { error: rpcError } = await (supabase.rpc as any)(
                  'verify_report',
                  {
                    p_report_id: report.id,
                    p_verifier_id: user.id,
                  }
                );

                if (rpcError) {
                  // Fallback: direct update
                  const { error: updateError } = await (supabase as any)
                    .from('reports')
                    .update({
                      status: 'verified',
                      verified_by: user.id,
                      verified_at: new Date().toISOString(),
                    })
                    .eq('id', report.id);

                  if (updateError) {
                    Alert.alert('Error', 'No se pudo verificar: ' + updateError.message);
                    return;
                  }
                }

                // Remove from local list and update stats
                setPendingReports((prev) => prev.filter((r) => r.id !== report.id));
                setSessionApproved((prev) => prev + 1);
                Alert.alert(
                  '✅ Reporte aprobado',
                  `"${report.title}" ahora es visible para la comunidad.`
                );
              } catch (e: any) {
                Alert.alert(
                  'Error',
                  'Error de conexión: ' + (e?.message || 'Verifica tu internet')
                );
              } finally {
                setActionLoading(null);
              }
            },
          },
        ]
      );
    },
    [user, isOwnReport]
  );

  // ─── Reject a report ────────────────────────────────────────
  const handleRejectStart = useCallback(
    (report: PendingReport) => {
      if (isOwnReport(report)) {
        Alert.alert('No permitido', 'No puedes rechazar tus propios reportes.');
        return;
      }
      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión para rechazar reportes.');
        return;
      }
      setRejectingReportId(report.id);
      setRejectionReason('');
    },
    [user, isOwnReport]
  );

  const handleRejectConfirm = useCallback(async () => {
    if (!rejectingReportId || !user) return;

    const reason = rejectionReason.trim() || 'Reporte rechazado por el verificador';
    const report = pendingReports.find((r) => r.id === rejectingReportId);

    setActionLoading(rejectingReportId);
    try {
      // Try RPC first
      const { error: rpcError } = await (supabase.rpc as any)('reject_report', {
        p_report_id: rejectingReportId,
        p_verifier_id: user.id,
        p_reason: reason,
      });

      if (rpcError) {
        // Fallback: direct update
        const { error: updateError } = await (supabase as any)
          .from('reports')
          .update({
            status: 'rejected',
            verified_by: user.id,
            verified_at: new Date().toISOString(),
            rejection_reason: reason,
          })
          .eq('id', rejectingReportId);

        if (updateError) {
          Alert.alert('Error', 'No se pudo rechazar: ' + updateError.message);
          return;
        }
      }

      setPendingReports((prev) => prev.filter((r) => r.id !== rejectingReportId));
      setSessionRejected((prev) => prev + 1);
      Alert.alert(
        'Reporte rechazado',
        `"${report?.title}" ha sido rechazado.`
      );
    } catch (e: any) {
      Alert.alert(
        'Error',
        'Error de conexión: ' + (e?.message || 'Verifica tu internet')
      );
    } finally {
      setActionLoading(null);
      setRejectingReportId(null);
      setRejectionReason('');
    }
  }, [rejectingReportId, rejectionReason, user, pendingReports]);

  const handleRejectCancel = useCallback(() => {
    setRejectingReportId(null);
    setRejectionReason('');
  }, []);

  // ─── Helpers ────────────────────────────────────────────────
  const getCategoryInfo = (cat: string) =>
    REPORT_CATEGORIES.find((c) => c.id === cat);

  const getSeverityLabel = (sev: number) => {
    if (sev >= 4) return { label: 'Alta', color: Colors.error };
    if (sev >= 3) return { label: 'Media', color: '#F59E0B' };
    return { label: 'Baja', color: Colors.primary };
  };

  const unreviewedCount = pendingReports.length;
  const resolutionCount = resolutionReports.length;

  // ─── Confirm resolution ─────────────────────────────────────
  const handleConfirmResolution = useCallback(
    (report: PendingReport) => {
      if (!user) return;
      Alert.alert(
        'Confirmar resolucion',
        `¿Confirmar que "${report.title}" fue resuelto correctamente?\n\nSe asignaran puntos ecologicos al usuario que lo atendio.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async () => {
              setActionLoading(report.id);
              try {
                // Update report to resolved
                const { error: updateError } = await (supabase as any)
                  .from('reports')
                  .update({
                    status: 'resolved',
                    resolved_at: new Date().toISOString(),
                    verified_by: user.id,
                    verified_at: new Date().toISOString(),
                  })
                  .eq('id', report.id);

                if (updateError) {
                  Alert.alert('Error', 'No se pudo confirmar: ' + updateError.message);
                  return;
                }

                // Award points to the user who attended
                if (report.attended_by) {
                  // +20 points to attendee, +5 to verifier
                  await (supabase.rpc as any)('add_eco_points', {
                    p_user_id: report.attended_by,
                    p_points: 20,
                  });
                  await (supabase.rpc as any)('add_eco_points', {
                    p_user_id: user.id,
                    p_points: 5,
                  });
                  // Update tasks_completed for attendee
                  const { data: attendeeProfile } = await (supabase as any)
                    .from('profiles')
                    .select('tasks_completed')
                    .eq('id', report.attended_by)
                    .maybeSingle();
                  if (attendeeProfile) {
                    await (supabase as any)
                      .from('profiles')
                      .update({ tasks_completed: (attendeeProfile.tasks_completed ?? 0) + 1 })
                      .eq('id', report.attended_by);
                  }
                }

                setResolutionReports((prev) => prev.filter((r) => r.id !== report.id));
                setSessionResolved((prev) => prev + 1);
                Alert.alert(
                  'Resolucion confirmada',
                  `"${report.title}" ha sido marcado como resuelto. Se asignaron puntos ecologicos.`
                );
              } catch (e: any) {
                Alert.alert('Error', 'Error de conexion: ' + (e?.message || 'Verifica tu internet'));
              } finally {
                setActionLoading(null);
              }
            },
          },
        ]
      );
    },
    [user]
  );

  // ─── Reject resolution ──────────────────────────────────────
  const handleRejectResolution = useCallback(
    (report: PendingReport) => {
      if (!user) return;
      Alert.alert(
        'Rechazar resolucion',
        `¿La evidencia de "${report.title}" no es suficiente?\n\nEl reporte volvera a estado "en progreso" sin evidencia.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Rechazar',
            style: 'destructive',
            onPress: async () => {
              setActionLoading(report.id);
              try {
                // Remove the after photo and keep in_progress
                const { error } = await (supabase as any)
                  .from('reports')
                  .update({ photo_after_url: null })
                  .eq('id', report.id);

                if (error) {
                  Alert.alert('Error', 'No se pudo rechazar: ' + error.message);
                  return;
                }

                setResolutionReports((prev) => prev.filter((r) => r.id !== report.id));
                Alert.alert(
                  'Evidencia rechazada',
                  'El usuario debera enviar nueva evidencia.'
                );
              } catch (e: any) {
                Alert.alert('Error', 'Error de conexion: ' + (e?.message || 'Verifica tu internet'));
              } finally {
                setActionLoading(null);
              }
            },
          },
        ]
      );
    },
    [user]
  );

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verificación</Text>
        <Text style={styles.headerSub}>
          {loading
            ? 'Cargando reportes...'
            : `${unreviewedCount} pendiente${unreviewedCount !== 1 ? 's' : ''} · ${resolutionCount} resolucion${resolutionCount !== 1 ? 'es' : ''}`}
        </Text>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Ionicons name="document-text" size={16} color={activeTab === 'pending' ? '#B45309' : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'pending' && { color: '#B45309', fontWeight: '700' }]}>
            Reportes nuevos
          </Text>
          {unreviewedCount > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.tabBadgeText}>{unreviewedCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'resolutions' && styles.tabActiveBlue]}
          onPress={() => setActiveTab('resolutions')}
        >
          <Ionicons name="shield-checkmark" size={16} color={activeTab === 'resolutions' ? '#1E40AF' : Colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'resolutions' && { color: '#1E40AF', fontWeight: '700' }]}>
            Resoluciones
          </Text>
          {resolutionCount > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: '#2563EB' }]}>
              <Text style={styles.tabBadgeText}>{resolutionCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Stats bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsRow}
      >
        <View style={[styles.statChip, { backgroundColor: '#FEF3C7' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="hourglass" size={16} color="#fff" />
          </View>
          <View>
            <Text style={[styles.statNumber, { color: '#92400E' }]}>
              {unreviewedCount}
            </Text>
            <Text style={[styles.statLabel, { color: '#B45309' }]}>
              Pendientes
            </Text>
          </View>
        </View>
        <View style={[styles.statChip, { backgroundColor: '#D1FAE5' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: Colors.primary }]}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
          </View>
          <View>
            <Text style={[styles.statNumber, { color: '#065F46' }]}>
              {sessionApproved}
            </Text>
            <Text style={[styles.statLabel, { color: '#047857' }]}>
              Aprobados
            </Text>
          </View>
        </View>
        <View style={[styles.statChip, { backgroundColor: '#FEE2E2' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: Colors.error }]}>
            <Ionicons name="close-circle" size={16} color="#fff" />
          </View>
          <View>
            <Text style={[styles.statNumber, { color: '#991B1B' }]}>
              {sessionRejected}
            </Text>
            <Text style={[styles.statLabel, { color: '#B91C1C' }]}>
              Rechazados
            </Text>
          </View>
        </View>
        <View style={[styles.statChip, { backgroundColor: '#E0F2FE' }]}>
          <View style={[styles.statIconWrap, { backgroundColor: '#2563EB' }]}>
            <Ionicons name="construct" size={16} color="#fff" />
          </View>
          <View>
            <Text style={[styles.statNumber, { color: '#1E3A5F' }]}>
              {sessionResolved}
            </Text>
            <Text style={[styles.statLabel, { color: '#2563EB' }]}>
              Resueltos
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Report list */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Loading */}
        {loading && (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.emptyText}>Cargando reportes...</Text>
          </View>
        )}

        {/* ═══ PENDING TAB ═══ */}
        {!loading && activeTab === 'pending' && (
          <>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text" size={18} color="#B45309" />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Reportes hechos por personas</Text>
                <Text style={styles.sectionDesc}>Verifica que los reportes nuevos de la comunidad sean legitimos antes de hacerlos publicos</Text>
              </View>
            </View>

            {pendingReports.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="checkmark-done-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No hay reportes pendientes</Text>
                <Text style={[styles.emptyText, { fontSize: 12 }]}>
                  Desliza hacia abajo para actualizar
                </Text>
              </View>
            )}

        {/* Report cards */}
        {!loading &&
          pendingReports.map((report) => {
            const cat = getCategoryInfo(report.category);
            const sev = getSeverityLabel(report.severity);
            const own = isOwnReport(report);
            const isActing = actionLoading === report.id;
            const isRejecting = rejectingReportId === report.id;

            return (
              <View
                key={report.id}
                style={[
                  styles.card,
                  styles.cardPending,
                  isActing && { opacity: 0.5 },
                ]}
              >
                {/* Own report badge */}
                {own && (
                  <View style={styles.ownBadge}>
                    <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                    <Text style={styles.ownBadgeText}>
                      Tu reporte — no puedes verificar
                    </Text>
                  </View>
                )}

                {/* Category + severity pills */}
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.catPill,
                      {
                        backgroundColor:
                          (cat?.color ?? Colors.textMuted) + '18',
                      },
                    ]}
                  >
                    <Ionicons
                      name={(cat?.icon ?? 'help-outline') as any}
                      size={14}
                      color={cat?.color ?? Colors.textMuted}
                    />
                    <Text style={[styles.catPillText, { color: cat?.color }]}>
                      {cat?.name ?? report.category}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.sevPill,
                      { backgroundColor: sev.color + '18' },
                    ]}
                  >
                    <Text style={[styles.sevPillText, { color: sev.color }]}>
                      Severidad: {sev.label}
                    </Text>
                  </View>
                </View>

                {/* Title + description */}
                <Text style={styles.cardTitle}>{report.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={3}>
                  {report.description}
                </Text>

                {/* Photo */}
                {report.photo_url ? (
                  <View style={styles.photoWrap}>
                    <Image
                      source={{ uri: report.photo_url }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                {/* Meta info */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="person-outline"
                      size={12}
                      color={Colors.textMuted}
                    />
                    <Text style={styles.metaText}>{report.userName}</Text>
                  </View>
                  {report.address ? (
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={Colors.textMuted}
                      />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {report.address}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={Colors.textMuted}
                    />
                    <Text style={styles.metaText}>
                      {formatTimeAgo(report.created_at)}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons
                    name="heart-outline"
                    size={12}
                    color={Colors.textMuted}
                  />
                  <Text style={styles.metaText}>
                    {report.likes_count} apoyo
                    {report.likes_count !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Rejection reason form (inline) */}
                {isRejecting && (
                  <View style={styles.rejectForm}>
                    <Text style={styles.rejectFormLabel}>
                      Razón del rechazo:
                    </Text>
                    <TextInput
                      style={styles.rejectFormInput}
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                      placeholder="Ej: Información insuficiente, reporte duplicado..."
                      placeholderTextColor={Colors.textMuted}
                      multiline
                      numberOfLines={2}
                      autoFocus
                    />
                    <View style={styles.rejectFormActions}>
                      <Pressable
                        style={styles.rejectFormCancel}
                        onPress={handleRejectCancel}
                      >
                        <Text style={styles.rejectFormCancelText}>
                          Cancelar
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.rejectFormConfirm,
                          isActing && { opacity: 0.5 },
                        ]}
                        onPress={handleRejectConfirm}
                        disabled={isActing}
                      >
                        {isActing ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons
                              name="close-circle"
                              size={16}
                              color="#fff"
                            />
                            <Text style={styles.rejectFormConfirmText}>
                              Confirmar rechazo
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Action buttons */}
                {!isRejecting && (
                  <View style={styles.actions}>
                    <Pressable
                      style={[
                        styles.actionBtn,
                        styles.rejectBtn,
                        (own || isActing) && styles.actionBtnDisabled,
                      ]}
                      onPress={() => handleRejectStart(report)}
                      disabled={own || isActing}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={own ? Colors.textMuted : Colors.error}
                      />
                      <Text
                        style={[
                          styles.rejectBtnText,
                          own && styles.actionTextDisabled,
                        ]}
                      >
                        Rechazar
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.actionBtn,
                        styles.approveBtn,
                        (own || isActing) && styles.actionBtnDisabled,
                      ]}
                      onPress={() => handleVerify(report)}
                      disabled={own || isActing}
                    >
                      {isActing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark"
                            size={18}
                            color={own ? Colors.textMuted : '#fff'}
                          />
                          <Text
                            style={[
                              styles.approveBtnText,
                              own && styles.actionTextDisabled,
                            ]}
                          >
                            Aprobar
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })}
          </>
        )}

        {/* ═══ RESOLUTIONS TAB ═══ */}
        {!loading && activeTab === 'resolutions' && (
          <>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#1E40AF" />
              </View>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Reportes resueltos por personas</Text>
                <Text style={styles.sectionDesc}>Confirma la evidencia de resolucion para otorgar puntos ecologicos y reconocimiento al usuario</Text>
              </View>
            </View>

            {resolutionReports.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="construct-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No hay resoluciones pendientes</Text>
                <Text style={[styles.emptyText, { fontSize: 12 }]}>
                  Las resoluciones aparecen cuando un usuario envia evidencia
                </Text>
              </View>
            )}

            {resolutionReports.map((report) => {
              const cat = getCategoryInfo(report.category);
              const isActing = actionLoading === report.id;

              return (
                <View
                  key={report.id}
                  style={[
                    styles.card,
                    { borderColor: '#2563EB' },
                    isActing && { opacity: 0.5 },
                  ]}
                >
                  {/* Resolution badge */}
                  <View style={styles.resolutionBadge}>
                    <Ionicons name="construct" size={14} color="#2563EB" />
                    <Text style={styles.resolutionBadgeText}>
                      Evidencia de resolucion
                    </Text>
                  </View>

                  {/* Category pill */}
                  <View style={styles.cardTop}>
                    <View
                      style={[
                        styles.catPill,
                        { backgroundColor: (cat?.color ?? Colors.textMuted) + '18' },
                      ]}
                    >
                      <Ionicons
                        name={(cat?.icon ?? 'help-outline') as any}
                        size={14}
                        color={cat?.color ?? Colors.textMuted}
                      />
                      <Text style={[styles.catPillText, { color: cat?.color }]}>
                        {cat?.name ?? report.category}
                      </Text>
                    </View>
                  </View>

                  {/* Title */}
                  <Text style={styles.cardTitle}>{report.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {report.description}
                  </Text>

                  {/* Before/After photos */}
                  <View style={styles.comparisonRow}>
                    {report.photo_url ? (
                      <View style={styles.comparisonItem}>
                        <Text style={styles.comparisonLabel}>Antes</Text>
                        <Image
                          source={{ uri: report.photo_url }}
                          style={styles.comparisonPhoto}
                          resizeMode="cover"
                        />
                      </View>
                    ) : null}
                    {report.photo_after_url ? (
                      <View style={styles.comparisonItem}>
                        <Text style={styles.comparisonLabel}>Despues</Text>
                        <Image
                          source={{ uri: report.photo_after_url }}
                          style={styles.comparisonPhoto}
                          resizeMode="cover"
                        />
                      </View>
                    ) : null}
                  </View>

                  {/* Meta */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.metaText}>Reportado por: {report.userName}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.metaText}>{formatTimeAgo(report.created_at)}</Text>
                    </View>
                  </View>

                  {/* Gamification preview - who resolved and what they earn */}
                  {report.attendedByName ? (
                    <View style={styles.rewardPreviewBox}>
                      <View style={styles.rewardPreviewHeader}>
                        <Ionicons name="person-circle" size={20} color="#1E40AF" />
                        <Text style={styles.rewardPreviewName}>{report.attendedByName}</Text>
                        <Text style={styles.rewardPreviewRole}>resolvio este reporte</Text>
                      </View>
                      <View style={styles.rewardPreviewDivider} />
                      <Text style={styles.rewardPreviewLabel}>Al confirmar, se otorgaran:</Text>
                      <View style={styles.rewardPreviewItems}>
                        <View style={styles.rewardItem}>
                          <Ionicons name="leaf" size={14} color={Colors.primary} />
                          <Text style={styles.rewardItemText}>+20 eco-puntos al resolutor</Text>
                        </View>
                        <View style={styles.rewardItem}>
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <Text style={styles.rewardItemText}>+1 tarea completada</Text>
                        </View>
                        <View style={styles.rewardItem}>
                          <Ionicons name="shield-checkmark" size={14} color="#2563EB" />
                          <Text style={styles.rewardItemText}>+5 eco-puntos al verificador</Text>
                        </View>
                      </View>
                    </View>
                  ) : null}

                  {/* Resolution actions */}
                  <View style={styles.actions}>
                    <Pressable
                      style={[styles.actionBtn, styles.rejectBtn, isActing && styles.actionBtnDisabled]}
                      onPress={() => handleRejectResolution(report)}
                      disabled={isActing}
                    >
                      <Ionicons name="close" size={18} color={Colors.error} />
                      <Text style={styles.rejectBtnText}>Evidencia insuficiente</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.actionBtn, styles.approveBtn, isActing && styles.actionBtnDisabled]}
                      onPress={() => handleConfirmResolution(report)}
                      disabled={isActing}
                    >
                      {isActing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={18} color="#fff" />
                          <Text style={styles.approveBtnText}>Confirmar</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FEF3C7' + '80',
    borderWidth: 1,
    borderColor: '#F59E0B' + '40',
  },
  tabActiveBlue: {
    backgroundColor: '#E0F2FE' + '80',
    borderWidth: 1,
    borderColor: '#2563EB' + '40',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 110,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: { fontSize: 17, fontWeight: '800', lineHeight: 20 },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 1 },

  list: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textMuted },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardPending: { borderColor: '#F59E0B' },

  ownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  ownBadgeText: { fontSize: 11, fontWeight: '600', color: '#92400E' },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catPillText: { fontSize: 11, fontWeight: '600' },
  sevPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sevPillText: { fontSize: 11, fontWeight: '600' },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },

  photoWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  photo: {
    width: '100%' as any,
    height: 160,
    borderRadius: 10,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.textMuted },

  // Rejection form
  rejectForm: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectFormLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 8,
  },
  rejectFormInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  rejectFormActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  rejectFormCancel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rejectFormCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  rejectFormConfirm: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.error,
  },
  rejectFormConfirmText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Action buttons
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnDisabled: { opacity: 0.35 },
  actionTextDisabled: { color: Colors.textMuted },
  rejectBtn: { backgroundColor: '#FEF2F2' },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: Colors.error },
  approveBtn: { backgroundColor: Colors.primary },
  approveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Resolution tab
  resolutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  resolutionBadgeText: { fontSize: 11, fontWeight: '600', color: '#1E40AF' },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  sectionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  // Gamification reward preview
  rewardPreviewBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rewardPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  rewardPreviewName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  rewardPreviewRole: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rewardPreviewDivider: {
    height: 1,
    backgroundColor: '#BFDBFE',
    marginBottom: 8,
  },
  rewardPreviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  rewardPreviewItems: {
    gap: 4,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  comparisonItem: {
    flex: 1,
    gap: 4,
  },
  comparisonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
  },
  comparisonPhoto: {
    width: '100%' as any,
    height: 140,
    borderRadius: 8,
  },
});
