import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Text from '../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useColors } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { File as ExpoFile } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import type { Report } from '../lib/database.types';

const CAT_COLORS: Record<string, string> = {
  trash: '#E24B4A',
  pothole: '#8B5E3C',
  drain: '#5B8FA8',
  water: '#378ADD',
  wildlife: '#BA7517',
  electronic: '#7F77DD',
  organic: '#1D9E75',
  other: '#6B7280',
};

const CATEGORY_LABELS: Record<string, string> = {
  trash: 'Basura',
  pothole: 'Bache',
  drain: 'Drenaje',
  water: 'Agua',
  wildlife: 'Vida silvestre',
  electronic: 'Electronico',
  organic: 'Organico',
  other: 'Otro',
};

type Step = 'details' | 'in_progress' | 'proof' | 'submitted';

export default function AttendReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const C = useColors();
  const styles = makeStyles(C);
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const { user, profile } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [reporterName, setReporterName] = useState('Usuario');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('details');
  const [proofPhotoUri, setProofPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch report
  useEffect(() => {
    if (!reportId) return;
    (async () => {
      const { data, error } = await (supabase as any)
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .maybeSingle();
      if (error) {
        Alert.alert('Error', 'No se pudo cargar el reporte');
        router.back();
        return;
      }
      if (!data) {
        Alert.alert('Error', 'Reporte no encontrado');
        router.back();
        return;
      }
      setReport(data as Report);

      // If already in_progress by this user, jump to proof step
      if (data.status === 'in_progress' && data.attended_by === user?.id) {
        setStep('in_progress');
      }

      // Fetch reporter name
      const { data: pData } = await (supabase as any)
        .from('profiles')
        .select('name')
        .eq('id', data.user_id)
        .maybeSingle();
      if (pData?.name) setReporterName(pData.name);

      setLoading(false);
    })();
  }, [reportId]);

  // Claim report (set to in_progress)
  const handleClaim = async () => {
    if (!report || !user) return;
    setSubmitting(true);

    // Try full update first; if attended_by/attended_at columns don't exist, fall back to status only
    let { error } = await (supabase as any)
      .from('reports')
      .update({
        status: 'in_progress',
        attended_by: user.id,
        attended_at: new Date().toISOString(),
      })
      .eq('id', report.id);

    if (error) {
      const fallback = await (supabase as any)
        .from('reports')
        .update({ status: 'in_progress' })
        .eq('id', report.id);
      if (fallback.error) {
        Alert.alert('Error', 'No se pudo reclamar el reporte');
        setSubmitting(false);
        return;
      }
    }

    setReport({ ...report, status: 'in_progress', attended_by: user.id });
    setStep('in_progress');
    setSubmitting(false);
  };

  // Take proof photo
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la camara para tomar la foto de evidencia');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setProofPhotoUri(result.assets[0].uri);
      setStep('proof');
    }
  };

  // Pick proof photo from gallery
  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setProofPhotoUri(result.assets[0].uri);
      setStep('proof');
    }
  };

  // Submit resolution for verification
  const handleSubmitResolution = async () => {
    if (!report || !user || !proofPhotoUri) return;
    setSubmitting(true);
    try {
      // Upload proof photo to Supabase Storage
      let photoAfterUrl: string | null = null;
      try {
        const fileName = `proof-${report.id}-${Date.now()}.jpg`;
        const file = new ExpoFile(proofPhotoUri);
        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await supabase.storage
          .from('report-photos')
          .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('report-photos')
            .getPublicUrl(fileName);
          photoAfterUrl = urlData.publicUrl;
        } else {
          console.warn('Proof photo upload error:', uploadError.message);
        }
      } catch {
        Alert.alert('Error', 'No se pudo procesar la foto');
        setSubmitting(false);
        return;
      }

      if (!photoAfterUrl) {
        Alert.alert('Error', 'No se pudo subir la foto de evidencia');
        setSubmitting(false);
        return;
      }

      // Update report with proof photo — status stays in_progress until verifier confirms
      const { error } = await (supabase as any)
        .from('reports')
        .update({
          photo_after_url: photoAfterUrl,
        })
        .eq('id', report.id);

      if (error) {
        Alert.alert('Error', 'No se pudo enviar la evidencia');
        setSubmitting(false);
        return;
      }

      setStep('submitted');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Cargando reporte...</Text>
        </View>
      </View>
    );
  }

  if (!report) return null;

  const categoryColor = CAT_COLORS[report.category] || CAT_COLORS.other;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {step === 'submitted' ? 'Evidencia enviada' : 'Atender reporte'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator */}
        <View style={styles.stepsRow}>
          {(['Detalles', 'En sitio', 'Evidencia', 'Enviado'] as const).map((label, i) => {
            const stepIndex = ['details', 'in_progress', 'proof', 'submitted'].indexOf(step);
            const isActive = i <= stepIndex;
            return (
              <View key={label} style={styles.stepItem}>
                <View style={[styles.stepCircle, isActive && styles.stepCircleActive]}>
                  {i < stepIndex ? (
                    <Ionicons name="checkmark" size={14} color={'#fff'} />
                  ) : (
                    <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Report info card */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '18' }]}>
              <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {CATEGORY_LABELS[report.category] || report.category}
              </Text>
            </View>
            <View style={styles.severityRow}>
              <Text style={styles.severityLabel}>Gravedad:</Text>
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.severityDot,
                    { backgroundColor: level <= report.severity ? C.accent : C.border },
                  ]}
                />
              ))}
            </View>
          </View>

          <Text style={styles.reportTitle}>{report.title}</Text>
          {report.description ? (
            <Text style={styles.reportDescription}>{report.description}</Text>
          ) : null}

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={C.textSecondary} />
            <Text style={styles.infoText}>Reportado por {reporterName}</Text>
          </View>
          {report.address ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={C.textSecondary} />
              <Text style={styles.infoText}>{report.address}</Text>
            </View>
          ) : null}

          {/* Before photo */}
          {report.photo_url ? (
            <View style={styles.photoSection}>
              <Text style={styles.photoLabel}>Foto del reporte (antes)</Text>
              <Image source={{ uri: report.photo_url }} style={styles.photo} resizeMode="cover" />
            </View>
          ) : null}
        </View>

        {/* STEP: details — show claim button */}
        {step === 'details' && report.status === 'verified' && (
          <View style={styles.actionSection}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={22} color={C.primary} />
              <Text style={styles.infoBoxText}>
                Al atender este reporte, te comprometes a ir al sitio y resolver el problema reportado. Tomando una foto de evidencia al terminar.
              </Text>
            </View>
            <Pressable
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleClaim}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={'#fff'} size="small" />
              ) : (
                <>
                  <Ionicons name="hand-left" size={20} color={'#fff'} />
                  <Text style={styles.primaryButtonText}>Atender este reporte</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Already claimed by someone else */}
        {step === 'details' && report.status === 'in_progress' && report.attended_by !== user?.id && (
          <View style={styles.actionSection}>
            <View style={[styles.infoBox, { borderColor: '#B8860B' }]}>
              <Ionicons name="alert-circle-outline" size={22} color={'#B8860B'} />
              <Text style={styles.infoBoxText}>
                Este reporte ya esta siendo atendido por otro usuario.
              </Text>
            </View>
          </View>
        )}

        {/* STEP: in_progress — at location, take proof */}
        {(step === 'in_progress') && (
          <View style={styles.actionSection}>
            <View style={[styles.infoBox, { borderColor: C.primary }]}>
              <Ionicons name="checkmark-circle-outline" size={22} color={C.primary} />
              <Text style={styles.infoBoxText}>
                Has reclamado este reporte. Ve al sitio, resuelve el problema y toma una foto como evidencia.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Tomar foto de evidencia</Text>
            <Text style={styles.sectionSubtitle}>
              Toma una foto que muestre que el problema ha sido resuelto
            </Text>

            <View style={styles.photoButtons}>
              <Pressable style={styles.photoButton} onPress={handleTakePhoto}>
                <Ionicons name="camera" size={28} color={C.primary} />
                <Text style={styles.photoButtonText}>Camara</Text>
              </Pressable>
              <Pressable style={styles.photoButton} onPress={handlePickPhoto}>
                <Ionicons name="images" size={28} color={C.primary} />
                <Text style={styles.photoButtonText}>Galeria</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP: proof — review and submit */}
        {step === 'proof' && proofPhotoUri && (
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Evidencia de resolucion</Text>

            {/* Before/After comparison */}
            <View style={styles.comparisonRow}>
              {report.photo_url ? (
                <View style={styles.comparisonItem}>
                  <Text style={styles.comparisonLabel}>Antes</Text>
                  <Image source={{ uri: report.photo_url }} style={styles.comparisonPhoto} resizeMode="cover" />
                </View>
              ) : null}
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Despues</Text>
                <Image source={{ uri: proofPhotoUri }} style={styles.comparisonPhoto} resizeMode="cover" />
              </View>
            </View>

            <View style={styles.proofActions}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => {
                  setProofPhotoUri(null);
                  setStep('in_progress');
                }}
              >
                <Ionicons name="refresh-outline" size={18} color={C.primary} />
                <Text style={styles.secondaryButtonText}>Retomar foto</Text>
              </Pressable>

              <Pressable
                style={[styles.primaryButton, { flex: 1 }, submitting && styles.buttonDisabled]}
                onPress={handleSubmitResolution}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={'#fff'} size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color={'#fff'} />
                    <Text style={styles.primaryButtonText}>Enviar evidencia</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* STEP: submitted — success */}
        {step === 'submitted' && (
          <View style={styles.actionSection}>
            <View style={styles.successBox}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={56} color={C.primary} />
              </View>
              <Text style={styles.successTitle}>Evidencia enviada</Text>
              <Text style={styles.successText}>
                Tu evidencia ha sido enviada para verificacion. Un verificador revisara tu foto y confirmara la resolucion del reporte. Recibiras una notificacion con el resultado.
              </Text>
              <View style={styles.rewardPreview}>
                <Ionicons name="leaf" size={20} color={C.primary} />
                <Text style={styles.rewardText}>
                  Al ser confirmado recibiras puntos ecologicos por tu contribucion
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={18} color={'#fff'} />
              <Text style={styles.primaryButtonText}>Volver al inicio</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (C: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: C.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
  },
  scrollView: {
    flex: 1,
  },

  // Steps
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: C.surface,
    marginBottom: 8,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: C.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: C.primary,
    fontWeight: '600',
  },

  // Report card
  reportCard: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: C.textSecondary,
    flex: 1,
  },
  severityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  severityLabel: {
    fontSize: 11,
    color: C.textMuted,
    marginRight: 4,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  photoSection: {
    marginTop: 12,
  },
  photoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
    marginBottom: 8,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },

  // Action section
  actionSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: C.primary + '0A',
    borderWidth: 1,
    borderColor: C.primary + '30',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 19,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 6,
  },
  secondaryButtonText: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Photo buttons
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: -4,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.primary + '30',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 28,
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.primary,
  },

  // Comparison
  comparisonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  comparisonItem: {
    flex: 1,
    gap: 6,
  },
  comparisonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSecondary,
    textAlign: 'center',
  },
  comparisonPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 10,
  },

  // Proof actions
  proofActions: {
    flexDirection: 'row',
    gap: 10,
  },

  // Success
  successBox: {
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  successIcon: {
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
  },
  successText: {
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.primary + '0A',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  rewardText: {
    flex: 1,
    fontSize: 13,
    color: C.primary,
    fontWeight: '500',
  },
});
