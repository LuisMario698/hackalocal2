import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import Text from '../../components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import ReportMapPicker from '../../components/ReportMapPicker';
import * as ImagePicker from 'expo-image-picker';

import { Colors } from '../../constants/Colors';
import { REPORT_CATEGORIES, type ReportCategory } from '../../constants/Gamification';
import { type ReportStatus } from '../../constants/MockData';
import { useUserLocation } from '../../hooks/useUserLocation';
import { haversineMeters } from '../../utils/geo';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { File } from 'expo-file-system';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MAX_DISTANCE = 500; // metros
const SCREEN_W = Dimensions.get('window').width;

// ─── Status helpers ──────────────────────────────────────────
const STATUS_MAP: Record<ReportStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: 'Pendiente', bg: Colors.status.pending, fg: Colors.status.pendingText },
  verified: { label: 'Verificado', bg: Colors.status.verified, fg: Colors.status.verifiedText },
  in_progress: { label: 'En progreso', bg: Colors.status.inProgress, fg: Colors.status.inProgressText },
  resolved: { label: 'Resuelto', bg: Colors.status.resolved, fg: Colors.status.resolvedText },
  rejected: { label: 'Rechazado', bg: Colors.status.rejected, fg: Colors.status.rejectedText },
};

// ─── Interfaces ─────────────────────────────────────────────
interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  address: string;
  createdAt: string;
}

// ─── Small report card ──────────────────────────────────────
function ReportCard({ report }: { report: ReportItem }) {
  const cat = REPORT_CATEGORIES.find(c => c.id === report.category);
  const st = STATUS_MAP[report.status] ?? STATUS_MAP.pending;
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={[s.catDot, { backgroundColor: cat?.color ?? Colors.textMuted }]} />
        <Text style={s.cardTitle} numberOfLines={1}>{report.title}</Text>
        <View style={[s.statusChip, { backgroundColor: st.bg }]}>
          <Text style={[s.statusText, { color: st.fg }]}>{st.label}</Text>
        </View>
      </View>
      <Text style={s.cardDesc} numberOfLines={2}>{report.description}</Text>
      <View style={s.cardFooter}>
        <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
        <Text style={s.cardAddr} numberOfLines={1}>{report.address}</Text>
        <Text style={s.cardDate}>{report.createdAt}</Text>
      </View>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═════════════════════════════════════════════════════════════
export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { location } = useUserLocation();
  const { user } = useAuth();

  // View toggle
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [pinCoord, setPinCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Supabase reports state
  const [myReports, setMyReports] = useState<ReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchMyReports = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('reports')
      .select('id, title, description, category, status, address, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching reports:', error.message);
      return;
    }

    setMyReports(
      (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description ?? '',
        category: r.category as ReportCategory,
        status: r.status as ReportStatus,
        address: r.address ?? '',
        createdAt: new Date(r.created_at).toLocaleDateString('es-MX'),
      })),
    );
  }, [user?.id]);

  useEffect(() => {
    setLoadingReports(true);
    fetchMyReports().finally(() => setLoadingReports(false));
  }, [fetchMyReports]);

  // ─── Pick photo ─────────────────────────────────────────
  const pickPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la camara para la foto comprobatoria.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  // ─── Map pin handler (enforce 500m) ─────────────────────
  const handleMapPress = useCallback(
    (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
      const coord = e.nativeEvent.coordinate;
      if (!location) {
        setPinCoord(coord);
        setPinError(null);
        return;
      }
      const dist = haversineMeters(location.latitude, location.longitude, coord.latitude, coord.longitude);
      if (dist > MAX_DISTANCE) {
        setPinError(`Ubicacion muy lejana (${Math.round(dist)}m). Maximo ${MAX_DISTANCE}m.`);
        setPinCoord(null);
      } else {
        setPinCoord(coord);
        setPinError(null);
      }
    },
    [location],
  );

  // ─── Nearby duplicate check ─────────────────────────────
  const [nearbyReports, setNearbyReports] = useState<{ id: string; title: string; status: ReportStatus; distance: number }[]>([]);

  useEffect(() => {
    if (!pinCoord) {
      setNearbyReports([]);
      return;
    }
    // Query reports near the pin from DB
    (async () => {
      const { data } = await supabase
        .from('reports')
        .select('id, title, status, latitude, longitude');
      if (!data) return;
      const nearby = data
        .map((r: any) => ({
          ...r,
          distance: Math.round(haversineMeters(pinCoord.latitude, pinCoord.longitude, r.latitude, r.longitude)),
        }))
        .filter((r: any) => r.distance < MAX_DISTANCE)
        .sort((a: any, b: any) => a.distance - b.distance);
      setNearbyReports(nearby);
    })();
  }, [pinCoord]);

  // ─── Submit ─────────────────────────────────────────────
  const canSubmit = category && title.trim() && description.trim() && photoUri && pinCoord && !pinError && !submitting;

  const doSubmit = async () => {
    if (!category || !pinCoord || !title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      // Use authenticated user if available, otherwise fall back to first profile
      let profileId = (user as any)?.id;
      if (!profileId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .single();
        profileId = (profileData as any)?.id;
      }

      if (!profileId) {
        Alert.alert('Error', 'No se encontro un usuario. Inicia sesion primero.');
        return;
      }

      // Upload photo to Supabase Storage
      let publicPhotoUrl: string | null = null;
      if (photoUri) {
        try {
          const fileName = `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
          const file = new File(photoUri);
          const arrayBuffer = await file.arrayBuffer();
          const { error: uploadError } = await supabase.storage
            .from('report-photos')
            .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('report-photos')
              .getPublicUrl(fileName);
            publicPhotoUrl = urlData.publicUrl;
          } else {
            console.warn('Photo upload error:', uploadError.message);
          }
        } catch (e) {
          console.warn('Photo upload failed:', e);
        }
      }

      const { error } = await supabase.from('reports').insert({
        user_id: profileId,
        title: title.trim(),
        description: description.trim(),
        category: category as any,
        severity: 3,
        latitude: pinCoord.latitude,
        longitude: pinCoord.longitude,
        address: '',
        photo_url: publicPhotoUrl ?? photoUri,
      } as any);

      if (error) {
        Alert.alert('Error', 'No se pudo enviar el reporte: ' + error.message);
      } else {
        Alert.alert('Reporte enviado', 'Tu reporte ha sido registrado y sera verificado pronto.');
        resetForm();
        fetchMyReports();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (nearbyReports.length > 0) {
      const closest = nearbyReports[0];
      Alert.alert(
        'Posible duplicado',
        `Hay ${nearbyReports.length} reporte(s) a menos de 500m.\nMas cercano: "${closest.title}" a ${closest.distance}m.\n\nEl verificador sera notificado.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Enviar de todos modos', onPress: doSubmit },
        ],
      );
    } else {
      doSubmit();
    }
  };

  const resetForm = () => {
    setCategory(null);
    setTitle('');
    setDescription('');
    setPhotoUri(null);
    setPinCoord(null);
    setPinError(null);
    setShowForm(false);
  };

  const userLat = location?.latitude ?? 31.3182;
  const userLng = location?.longitude ?? -113.5348;

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{showForm ? 'Nuevo reporte' : 'Mis reportes'}</Text>
        {showForm && (
          <Pressable style={s.headerBtnCancel} onPress={resetForm}>
            <Ionicons name="close" size={20} color={Colors.error} />
            <Text style={s.headerBtnTextCancel}>Cancelar</Text>
          </Pressable>
        )}
      </View>

      {/* ═══ LIST VIEW ═══ */}
      {!showForm && (
        <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
          {loadingReports ? (
            <View style={s.empty}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : myReports.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
              <Text style={s.emptyText}>Aun no hay reportes</Text>
              <Text style={[s.emptyText, { fontSize: 13 }]}>Toca el boton + para crear uno</Text>
            </View>
          ) : (
            myReports.map(r => (
              <ReportCard key={r.id} report={r} />
            ))
          )}
          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* ═══ FORM VIEW ═══ */}
      {showForm && (
        <ScrollView contentContainerStyle={s.formContent} showsVerticalScrollIndicator={false}>
          {/* Category */}
          <Text style={s.label}>Categoria</Text>
          <View style={s.catRow}>
            {REPORT_CATEGORIES.map(cat => {
              const selected = category === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[s.catChip, selected && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={selected ? '#fff' : cat.color}
                  />
                  <Text style={[s.catChipText, selected && { color: '#fff' }]}>{cat.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Title */}
          <Text style={s.label}>Titulo</Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Bache peligroso en Av. Principal"
            placeholderTextColor={Colors.textMuted}
          />

          {/* Description */}
          <Text style={s.label}>Descripcion</Text>
          <TextInput
            style={[s.input, s.inputMulti]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe el problema con detalle..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />

          {/* Photo */}
          <Text style={s.label}>Foto comprobatoria (obligatoria)</Text>
          {photoUri ? (
            <View style={s.photoPreview}>
              <Image source={{ uri: photoUri }} style={s.photoImage} />
              <Pressable style={s.photoRemove} onPress={() => setPhotoUri(null)}>
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </Pressable>
            </View>
          ) : (
            <View style={s.photoRow}>
              <Pressable style={s.photoBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                <Text style={s.photoBtnText}>Camara</Text>
              </Pressable>
              <Pressable style={s.photoBtn} onPress={pickPhoto}>
                <Ionicons name="image-outline" size={22} color={Colors.primary} />
                <Text style={s.photoBtnText}>Galeria</Text>
              </Pressable>
            </View>
          )}

          {/* Map location picker */}
          <Text style={s.label}>Ubicacion del reporte</Text>
          <Text style={s.hint}>Toca el mapa para colocar el pin (max {MAX_DISTANCE}m de ti)</Text>
          <ReportMapPicker
            userLat={userLat}
            userLng={userLng}
            pinCoord={pinCoord}
            onPress={handleMapPress}
            mapRef={mapRef}
            maxDistance={MAX_DISTANCE}
          />
          {pinError && (
            <View style={s.pinErrorRow}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={s.pinErrorText}>{pinError}</Text>
            </View>
          )}
          {pinCoord && !pinError && (
            <View style={s.pinOkRow}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={s.pinOkText}>
                Ubicacion seleccionada ({Math.round(haversineMeters(userLat, userLng, pinCoord.latitude, pinCoord.longitude))}m de ti)
              </Text>
            </View>
          )}

          {/* Nearby duplicate warning */}
          {nearbyReports.length > 0 && (
            <View style={s.warnBox}>
              <Ionicons name="warning" size={18} color={Colors.status.pendingText} />
              <View style={s.warnText}>
                <Text style={s.warnTitle}>Reportes cercanos detectados</Text>
                {nearbyReports.map(nr => (
                  <Text key={nr.id} style={s.warnItem}>
                    - "{nr.title}" a {nr.distance}m ({(STATUS_MAP[nr.status as ReportStatus] ?? STATUS_MAP.pending).label})
                  </Text>
                ))}
                <Text style={s.warnHint}>El verificador sera notificado de posibles duplicados.</Text>
              </View>
            </View>
          )}

          {/* Submit */}
          <Pressable
            style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={s.submitText}>Enviar reporte</Text>
          </Pressable>

          {!canSubmit && (
            <Text style={s.missingHint}>
              {!category ? 'Selecciona una categoria' :
               !title.trim() ? 'Agrega un titulo' :
               !description.trim() ? 'Agrega una descripcion' :
               !photoUri ? 'Sube una foto comprobatoria' :
               !pinCoord ? 'Selecciona la ubicacion en el mapa' :
               pinError ?? ''}
            </Text>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* FAB */}
      {!showForm && (
        <>
          <Pressable style={[s.aiFab, { bottom: 188 + insets.bottom }]} onPress={() => router.push('/(tabs)/chat' as any)}>
            <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
          </Pressable>
          <Pressable style={[s.fab, { bottom: 120 + insets.bottom }]} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={30} color="#fff" />
          </Pressable>
        </>
      )}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════
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
  headerBtnCancel: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  headerBtnTextCancel: { fontSize: 13, fontWeight: '700' as const, color: Colors.error },

  // FAB
  fab: {
    position: 'absolute' as const,
    right: 20,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  aiFab: {
    position: 'absolute' as const,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0F766E',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  // List
  listContent: { paddingHorizontal: 20 },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: Colors.textMuted },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text },
  statusChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardAddr: { flex: 1, fontSize: 11, color: Colors.textMuted },
  cardDate: { fontSize: 11, color: Colors.textMuted },

  // Form
  formContent: { paddingHorizontal: 20, paddingBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 6,
  },
  hint: { fontSize: 11, color: Colors.textMuted, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 12, default: 10 }),
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputMulti: { minHeight: 70, textAlignVertical: 'top' },

  // Category chips
  catRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  catChipText: { fontSize: 12, fontWeight: '600', color: Colors.text },

  // Photo
  photoRow: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  photoPreview: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  photoImage: { width: '100%', height: 180, borderRadius: 12 },
  photoRemove: { position: 'absolute', top: 8, right: 8 },

  // Map
  mapWrap: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  map: { flex: 1 },

  // Pin feedback
  pinErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  pinErrorText: { fontSize: 12, color: Colors.error },
  pinOkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  pinOkText: { fontSize: 12, color: Colors.success },

  // Nearby warning
  warnBox: {
    flexDirection: 'row',
    backgroundColor: Colors.status.pending,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    gap: 10,
  },
  warnText: { flex: 1 },
  warnTitle: { fontSize: 13, fontWeight: '700', color: Colors.status.pendingText, marginBottom: 4 },
  warnItem: { fontSize: 11, color: Colors.status.pendingText },
  warnHint: { fontSize: 10, color: Colors.status.pendingText, marginTop: 4, fontStyle: 'italic' },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  missingHint: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
