import { useState, useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Text from '../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { REPORTS, MockReport } from '../constants/MockData';
import { REPORT_CATEGORIES } from '../constants/Gamification';

// ID del verificador de prueba (no puede aprobar sus propios reportes)
const VERIFIER_ID = 'verifier-001';

type Verdict = 'verified' | 'rejected';

export default function VerifierScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Solo reportes pendientes
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});
  const pendingReports = REPORTS.filter((r) => r.status === 'pending');

  const isOwnReport = (r: MockReport) => r.userId === VERIFIER_ID;

  const handleVerify = useCallback((report: MockReport) => {
    if (isOwnReport(report)) {
      Alert.alert('No permitido', 'No puedes verificar tus propios reportes.');
      return;
    }
    Alert.alert(
      'Verificar reporte',
      `Aprobar "${report.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: () =>
            setVerdicts((prev) => ({ ...prev, [report.id]: 'verified' })),
        },
      ]
    );
  }, []);

  const handleReject = useCallback((report: MockReport) => {
    if (isOwnReport(report)) {
      Alert.alert('No permitido', 'No puedes rechazar tus propios reportes.');
      return;
    }
    Alert.alert(
      'Rechazar reporte',
      `Rechazar "${report.title}"? Esto notificara al usuario.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () =>
            setVerdicts((prev) => ({ ...prev, [report.id]: 'rejected' })),
        },
      ]
    );
  }, []);

  const getCategoryInfo = (cat: string) =>
    REPORT_CATEGORIES.find((c) => c.id === cat);

  const getSeverityLabel = (sev: number) => {
    if (sev >= 4) return { label: 'Alta', color: Colors.error };
    if (sev >= 3) return { label: 'Media', color: '#F59E0B' };
    return { label: 'Baja', color: Colors.primary };
  };

  const unreviewedCount = pendingReports.filter((r) => !verdicts[r.id]).length;

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Panel de verificacion</Text>
          <Text style={s.headerSub}>
            {unreviewedCount} reporte{unreviewedCount !== 1 ? 's' : ''} pendiente{unreviewedCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <Pressable style={s.skipBtn} onPress={() => router.replace('/(tabs)' as any)}>
          <Text style={s.skipBtnText}>Ver app</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Stats bar */}
      <View style={s.statsRow}>
        <View style={s.statChip}>
          <Ionicons name="hourglass-outline" size={14} color="#F59E0B" />
          <Text style={s.statText}>{unreviewedCount} pendientes</Text>
        </View>
        <View style={s.statChip}>
          <Ionicons name="checkmark-circle-outline" size={14} color={Colors.primary} />
          <Text style={s.statText}>
            {Object.values(verdicts).filter((v) => v === 'verified').length} aprobados
          </Text>
        </View>
        <View style={s.statChip}>
          <Ionicons name="close-circle-outline" size={14} color={Colors.error} />
          <Text style={s.statText}>
            {Object.values(verdicts).filter((v) => v === 'rejected').length} rechazados
          </Text>
        </View>
      </View>

      {/* Report list */}
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {pendingReports.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="checkmark-done-outline" size={48} color={Colors.textMuted} />
            <Text style={s.emptyText}>No hay reportes pendientes</Text>
          </View>
        )}

        {pendingReports.map((report) => {
          const cat = getCategoryInfo(report.category);
          const sev = getSeverityLabel(report.severity);
          const verdict = verdicts[report.id];
          const own = isOwnReport(report);

          return (
            <View
              key={report.id}
              style={[
                s.card,
                verdict === 'verified' && s.cardVerified,
                verdict === 'rejected' && s.cardRejected,
              ]}
            >
              {/* Verdict badge */}
              {verdict && (
                <View style={[s.verdictBadge, verdict === 'verified' ? s.verdictApproved : s.verdictDenied]}>
                  <Ionicons
                    name={verdict === 'verified' ? 'checkmark-circle' : 'close-circle'}
                    size={14}
                    color="#fff"
                  />
                  <Text style={s.verdictText}>
                    {verdict === 'verified' ? 'Aprobado' : 'Rechazado'}
                  </Text>
                </View>
              )}

              {/* Own report warning */}
              {own && !verdict && (
                <View style={s.ownBadge}>
                  <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                  <Text style={s.ownBadgeText}>Tu reporte — no puedes verificar</Text>
                </View>
              )}

              {/* Top row: category + severity */}
              <View style={s.cardTop}>
                <View style={[s.catPill, { backgroundColor: (cat?.color ?? Colors.textMuted) + '18' }]}>
                  <Ionicons name={(cat?.icon ?? 'help-outline') as any} size={14} color={cat?.color ?? Colors.textMuted} />
                  <Text style={[s.catPillText, { color: cat?.color }]}>{cat?.name ?? report.category}</Text>
                </View>
                <View style={[s.sevPill, { backgroundColor: sev.color + '18' }]}>
                  <Text style={[s.sevPillText, { color: sev.color }]}>Severidad: {sev.label}</Text>
                </View>
              </View>

              {/* Title + description */}
              <Text style={s.cardTitle}>{report.title}</Text>
              <Text style={s.cardDesc} numberOfLines={3}>{report.description}</Text>

              {/* Meta row */}
              <View style={s.metaRow}>
                <View style={s.metaItem}>
                  <Ionicons name="person-outline" size={12} color={Colors.textMuted} />
                  <Text style={s.metaText}>{report.userName}</Text>
                </View>
                <View style={s.metaItem}>
                  <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                  <Text style={s.metaText} numberOfLines={1}>{report.address}</Text>
                </View>
                <View style={s.metaItem}>
                  <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                  <Text style={s.metaText}>{report.createdAt}</Text>
                </View>
              </View>

              {/* Likes */}
              <View style={s.metaItem}>
                <Ionicons name="heart-outline" size={12} color={Colors.textMuted} />
                <Text style={s.metaText}>{report.likesCount} apoyo{report.likesCount !== 1 ? 's' : ''}</Text>
              </View>

              {/* Action buttons */}
              {!verdict && (
                <View style={s.actions}>
                  <Pressable
                    style={[s.actionBtn, s.rejectBtn, own && s.actionBtnDisabled]}
                    onPress={() => handleReject(report)}
                    disabled={own}
                  >
                    <Ionicons name="close" size={18} color={own ? Colors.textMuted : Colors.error} />
                    <Text style={[s.rejectBtnText, own && s.actionTextDisabled]}>Rechazar</Text>
                  </Pressable>
                  <Pressable
                    style={[s.actionBtn, s.approveBtn, own && s.actionBtnDisabled]}
                    onPress={() => handleVerify(report)}
                    disabled={own}
                  >
                    <Ionicons name="checkmark" size={18} color={own ? Colors.textMuted : '#fff'} />
                    <Text style={[s.approveBtnText, own && s.actionTextDisabled]}>Aprobar</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  skipBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },

  // List
  list: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textMuted },

  // Card
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
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  cardVerified: {
    borderLeftColor: Colors.primary,
    opacity: 0.7,
  },
  cardRejected: {
    borderLeftColor: Colors.error,
    opacity: 0.7,
  },

  // Verdict badge
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  verdictApproved: { backgroundColor: Colors.primary },
  verdictDenied: { backgroundColor: Colors.error },
  verdictText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Own report badge
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

  // Card top
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
  sevPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sevPillText: { fontSize: 11, fontWeight: '600' },

  // Card content
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },

  // Meta
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: { fontSize: 11, color: Colors.textMuted },

  // Actions
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
  actionBtnDisabled: {
    opacity: 0.35,
  },
  actionTextDisabled: {
    color: Colors.textMuted,
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
  },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: Colors.error },
  approveBtn: {
    backgroundColor: Colors.primary,
  },
  approveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
