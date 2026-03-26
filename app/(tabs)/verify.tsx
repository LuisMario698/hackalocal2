import { useState, useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Text from '../../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { REPORTS, MockReport } from '../../constants/MockData';
import { REPORT_CATEGORIES } from '../../constants/Gamification';

const VERIFIER_ID = 'verifier-001';

type Verdict = 'verified' | 'rejected';

export default function VerifierTab() {
  const insets = useSafeAreaInsets();

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
        <Text style={s.headerTitle}>Verificacion</Text>
        <Text style={s.headerSub}>
          {unreviewedCount} reporte{unreviewedCount !== 1 ? 's' : ''} pendiente{unreviewedCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Stats bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statsRow}>
        <View style={[s.statChip, { backgroundColor: '#FEF3C7' }]}>
          <View style={[s.statIconWrap, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="hourglass" size={16} color="#fff" />
          </View>
          <View>
            <Text style={[s.statNumber, { color: '#92400E' }]}>{unreviewedCount}</Text>
            <Text style={[s.statLabel, { color: '#B45309' }]}>Pendientes</Text>
          </View>
        </View>
        <View style={[s.statChip, { backgroundColor: '#D1FAE5' }]}>
          <View style={[s.statIconWrap, { backgroundColor: Colors.primary }]}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
          </View>
          <View>
            <Text style={[s.statNumber, { color: '#065F46' }]}>
              {Object.values(verdicts).filter((v) => v === 'verified').length}
            </Text>
            <Text style={[s.statLabel, { color: '#047857' }]}>Aprobados</Text>
          </View>
        </View>
        <View style={[s.statChip, { backgroundColor: '#FEE2E2' }]}>
          <View style={[s.statIconWrap, { backgroundColor: Colors.error }]}>
            <Ionicons name="close-circle" size={16} color="#fff" />
          </View>
          <View>
            <Text style={[s.statNumber, { color: '#991B1B' }]}>
              {Object.values(verdicts).filter((v) => v === 'rejected').length}
            </Text>
            <Text style={[s.statLabel, { color: '#B91C1C' }]}>Rechazados</Text>
          </View>
        </View>
      </ScrollView>

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
                !verdict && s.cardPending,
              ]}
            >
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

              {own && !verdict && (
                <View style={s.ownBadge}>
                  <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                  <Text style={s.ownBadgeText}>Tu reporte — no puedes verificar</Text>
                </View>
              )}

              <View style={s.cardTop}>
                <View style={[s.catPill, { backgroundColor: (cat?.color ?? Colors.textMuted) + '18' }]}>
                  <Ionicons name={(cat?.icon ?? 'help-outline') as any} size={14} color={cat?.color ?? Colors.textMuted} />
                  <Text style={[s.catPillText, { color: cat?.color }]}>{cat?.name ?? report.category}</Text>
                </View>
                <View style={[s.sevPill, { backgroundColor: sev.color + '18' }]}>
                  <Text style={[s.sevPillText, { color: sev.color }]}>Severidad: {sev.label}</Text>
                </View>
              </View>

              <Text style={s.cardTitle}>{report.title}</Text>
              <Text style={s.cardDesc} numberOfLines={3}>{report.description}</Text>

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

              <View style={s.metaItem}>
                <Ionicons name="heart-outline" size={12} color={Colors.textMuted} />
                <Text style={s.metaText}>{report.likesCount} apoyo{report.likesCount !== 1 ? 's' : ''}</Text>
              </View>

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

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

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
  cardVerified: { borderColor: Colors.primary, opacity: 0.7 },
  cardRejected: { borderColor: Colors.error, opacity: 0.7 },

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

  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 10 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.textMuted },

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
});
