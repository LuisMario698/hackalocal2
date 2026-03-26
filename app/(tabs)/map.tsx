import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, Animated, Pressable, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../../components/ScaledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapComponent from '../../components/MapComponent';
import { useUserLocation } from '../../hooks/useUserLocation';
import { useMapHighlight } from '../../contexts/MapHighlightContext';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export type ReportCategory = 'trash' | 'pothole' | 'drain' | 'water' | 'wildlife' | 'electronic' | 'organic' | 'other';

interface ScaleButtonProps {
  onPress?: (e?: any) => void;
  children: React.ReactNode;
  style?: any;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ScaleButton: React.FC<ScaleButtonProps> = ({ onPress, children, style, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 10,
    }).start();
  };

  return (
    <AnimatedPressable 
      onPressIn={onPressIn} 
      onPressOut={onPressOut} 
      onPress={onPress}
      disabled={disabled}
      style={[{ transform: [{ scale }] }, style]}
    >
      {children}
    </AnimatedPressable>
  );
};

export interface ReportMock {
  id: string;
  title: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  status: string;
  description: string | null;
}

const CATEGORIES = [
  { id: 'all', label: 'Todos', color: '#1F2937' },
  { id: 'trash', label: 'Basura', color: '#EF4444' },
  { id: 'pothole', label: 'Bache', color: '#8B5E3C' },
  { id: 'drain', label: 'Drenaje', color: '#5B8FA8' },
  { id: 'water', label: 'Agua', color: '#3B82F6' },
  { id: 'wildlife', label: 'Fauna', color: '#F59E0B' },
  { id: 'electronic', label: 'Electr.', color: '#8B5CF6' },
  { id: 'organic', label: 'Orgánico', color: '#10B981' },
  { id: 'other', label: 'Otro', color: '#6B7280' },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Decodifica polyline6 (formato de Valhalla)
function decodePolyline6(encoded: string): { latitude: number; longitude: number }[] {
  const coords: { latitude: number; longitude: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push({ latitude: lat / 1e6, longitude: lng / 1e6 });
  }
  return coords;
}

type RouteResult = {
  coords: { latitude: number; longitude: number }[];
  distanceKm: number;
  durationMins: number;
};

async function fetchStreetRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number,
  signal: AbortSignal
): Promise<RouteResult | null> {
  const seg = `${fromLng},${fromLat};${toLng},${toLat}`;
  const qs = '?overview=full&geometries=geojson';

  const osrm = (base: string) =>
    fetch(`${base}${seg}${qs}`, { signal })
      .then(r => r.json())
      .then((d): RouteResult => {
        if (!d.routes?.[0]) throw new Error('empty');
        const r = d.routes[0];
        return {
          coords: r.geometry.coordinates.map((c: number[]) => ({ latitude: c[1], longitude: c[0] })),
          distanceKm: r.distance / 1000,
          durationMins: Math.max(1, Math.round(r.duration / 60)),
        };
      });

  const valhalla = fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      locations: [{ lon: fromLng, lat: fromLat }, { lon: toLng, lat: toLat }],
      costing: 'auto',
      directions_type: 'none',
      units: 'kilometers',
    }),
  }).then(r => r.json()).then((d): RouteResult => {
    if (!d.trip?.legs?.[0]?.shape) throw new Error('empty');
    return {
      coords: decodePolyline6(d.trip.legs[0].shape),
      distanceKm: d.trip.summary.length,
      durationMins: Math.max(1, Math.round(d.trip.summary.time / 60)),
    };
  });

  try {
    return await Promise.any([
      osrm('https://router.project-osrm.org/route/v1/driving/'),
      osrm('https://routing.openstreetmap.de/routed-car/route/v1/driving/'),
      valhalla,
    ]);
  } catch {
    return null;
  }
}

export default function MapScreen() {
  const router = useRouter();
  const { location, errorMsg } = useUserLocation();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<ReportMock | null>(null);
  const [expandedCard, setExpandedCard] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);
  const insets = useSafeAreaInsets();

  // Supabase state
  const [mapReports, setMapReports] = useState<ReportMock[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  const fetchMapReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('id, title, category, latitude, longitude, photo_url, status, description')
      .in('status', ['pending', 'verified', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching map reports:', error.message);
      return;
    }

    const mapped: ReportMock[] = (data ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      category: r.category as ReportCategory,
      latitude: r.latitude,
      longitude: r.longitude,
      photo_url: r.photo_url ?? null,
      status: r.status ?? 'pending',
      description: r.description ?? null,
    }));

    setMapReports(prev => {
      // If selected report is no longer in the new list, deselect it
      setSelectedReport(current => {
        if (current && !mapped.find(r => r.id === current.id)) return null;
        return current;
      });
      return mapped;
    });
  }, []);

  useEffect(() => {
    setLoadingReports(true);
    fetchMapReports().finally(() => setLoadingReports(false));

    const channel = supabase
      .channel('map-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchMapReports();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMapReports]);

  // Refresh when tab is focused (e.g. coming back from attend-report)
  useFocusEffect(
    useCallback(() => {
      fetchMapReports();
    }, [fetchMapReports])
  );

  const filteredReports = activeFilter === 'all' 
    ? mapReports 
    : mapReports.filter(r => r.category === activeFilter);

  const handleFilterPress = (catId: string) => {
    setActiveFilter(catId);
    setShowFilters(false);
    setSelectedReport(null);
    setShowRoute(false);
    setRouteCoords([]);
  };

  const handleSelectReport = (report: ReportMock | null) => {
    setSelectedReport(report);
    setExpandedCard(false);
    setShowRoute(false);
    setRouteCoords([]);
    setShowFilters(false);
  };

  const { highlightedReportId, clearHighlight } = useMapHighlight();

  useFocusEffect(
    React.useCallback(() => {
      if (highlightedReportId) {
        const reportToSelect = mapReports.find(r => r.id === highlightedReportId);
        
        if (reportToSelect) {
          if (activeFilter !== 'all' && activeFilter !== reportToSelect.category) {
            setActiveFilter('all');
          }
          handleSelectReport(reportToSelect);
          clearHighlight();
        }
      }
    }, [highlightedReportId, activeFilter, clearHighlight, mapReports])
  );

  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMins: number } | null>(null);

  const toggleRoute = async () => {
    if (showRoute) {
      setShowRoute(false);
      setRouteCoords([]);
      setRouteInfo(null);
      return;
    }

    if (!location || !selectedReport) return;

    setShowRoute(true);
    setLoadingRoute(true);

    const fallbackCoords = [
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: selectedReport.latitude, longitude: selectedReport.longitude },
    ];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const result = await fetchStreetRoute(
        location.latitude, location.longitude,
        selectedReport.latitude, selectedReport.longitude,
        controller.signal
      );
      clearTimeout(timeoutId);

      if (result) {
        setRouteCoords(result.coords);
        setRouteInfo({ distanceKm: result.distanceKm, durationMins: result.durationMins });
      } else {
        // Solo llega aquí si los 3 servidores fallan
        const straightKm = calculateDistance(location.latitude, location.longitude, selectedReport.latitude, selectedReport.longitude);
        setRouteCoords(fallbackCoords);
        setRouteInfo({ distanceKm: straightKm, durationMins: Math.max(1, Math.round((straightKm / 40) * 60)) });
      }
    } catch (e) {
      const straightKm = calculateDistance(location.latitude, location.longitude, selectedReport.latitude, selectedReport.longitude);
      setRouteCoords(fallbackCoords);
      setRouteInfo({ distanceKm: straightKm, durationMins: Math.max(1, Math.round((straightKm / 40) * 60)) });
    } finally {
      setLoadingRoute(false);
    }
  };

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: '#EF4444', textAlign: 'center', fontWeight: 'bold' }}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <View style={[styles.filterContainer, { top: (insets.top || 10) + 15 }]} pointerEvents="box-none">
        {activeFilter !== 'all' ? (
          <ScaleButton 
            style={[styles.filterPillMain, { borderColor: CATEGORIES.find(c => c.id === activeFilter)?.color || '#1D9E75', borderWidth: 1.5 }]} 
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={18} color={CATEGORIES.find(c => c.id === activeFilter)?.color || '#1D9E75'} />
            <Text style={[styles.filterPillMainText, { color: CATEGORIES.find(c => c.id === activeFilter)?.color || '#111827' }]}>
              {CATEGORIES.find(c => c.id === activeFilter)?.label}
            </Text>
            <TouchableOpacity 
              style={styles.clearFilterIcon} 
              onPress={(e) => { e.stopPropagation(); handleFilterPress('all'); setShowFilters(false); }}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </ScaleButton>
        ) : (
          <ScaleButton 
            style={styles.filterPillMain} 
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={20} color="#1F2937" />
            <Text style={styles.filterPillMainText}>Filtros</Text>
            {showFilters && <Ionicons name="chevron-up" size={16} color="#6B7280" style={{ marginLeft: 6 }} />}
            {!showFilters && <Ionicons name="chevron-down" size={16} color="#6B7280" style={{ marginLeft: 6 }} />}
          </ScaleButton>
        )}
        
        {showFilters && (
          <View style={styles.filterDropdownWrapper}>
            {CATEGORIES.map(cat => {
              const isActive = activeFilter === cat.id;
              return (
                <ScaleButton
                  key={cat.id}
                  style={[
                    styles.filterDropdownItem,
                    isActive && styles.filterDropdownItemActive
                  ]}
                  onPress={() => handleFilterPress(cat.id)}
                >
                  <View style={[styles.dropdownDot, { backgroundColor: cat.color, position: 'absolute', left: 16 }]} />
                  <Text style={{ 
                    color: isActive ? '#111827' : '#4B5563', 
                    fontWeight: isActive ? 'bold' : '600',
                    fontSize: 15,
                    textAlign: 'center',
                    flex: 1
                  }}>
                    {cat.label}
                  </Text>
                  {isActive && <Ionicons name="checkmark" size={18} color="#1D9E75" style={{ position: 'absolute', right: 16 }} />}
                </ScaleButton>
              )
            })}
          </View>
        )}
      </View>

      <MapComponent 
        userLocation={location} 
        reports={filteredReports} 
        selectedReport={selectedReport}
        onSelectReport={handleSelectReport}
        routeCoordinates={showRoute ? routeCoords : []}
      />

      {selectedReport && (
        <View style={styles.cardsStack} pointerEvents="box-none">
          <View style={[styles.compactCard, { padding: 0 }]}>
            <ScaleButton 
              style={{ padding: 16, paddingBottom: 8 }}
              onPress={() => {
                setExpandedCard(!expandedCard);
                setShowFilters(false);
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardTitle} numberOfLines={expandedCard ? 3 : 1}>{selectedReport.title}</Text>
                  <Text style={styles.cardCategory}>
                    {CATEGORIES.find(c => c.id === selectedReport.category)?.label}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={() => handleSelectReport(null)}>
                  <Ionicons name="close" size={18} color="#4B5563" />
                </TouchableOpacity>
              </View>

              {expandedCard && (
                <View style={styles.expandedContent}>
                  {selectedReport.description ? (
                    <Text style={styles.expandedDescription}>
                      {selectedReport.description}
                    </Text>
                  ) : null}
                  {selectedReport.photo_url ? (
                    <Image
                      source={{ uri: selectedReport.photo_url }}
                      style={styles.expandedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.expandedMockImage}>
                      <Ionicons name="image-outline" size={40} color="#9CA3AF" />
                      <Text style={styles.expandedMockImageText}>Sin foto adjunta</Text>
                    </View>
                  )}
                </View>
              )}
            </ScaleButton>

            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              {showRoute && routeInfo ? (
                <View style={styles.routeCompactInfo}>
                  <View style={styles.routeMetric}>
                    <Ionicons name="car" size={16} color="#6B7280" />
                    <Text style={styles.routeMetricText}>{routeInfo.durationMins}m</Text>
                  </View>
                  <View style={styles.routeMetric}>
                    <Ionicons name="walk" size={16} color="#6B7280" />
                    <Text style={styles.routeMetricText}>{Math.max(1, Math.round(routeInfo.durationMins * 8))}m</Text>
                  </View>
                  <View style={styles.routeMetric}>
                    <Ionicons name="location" size={16} color="#6B7280" />
                    <Text style={styles.routeMetricText}>{routeInfo.distanceKm.toFixed(1)} km</Text>
                  </View>
                </View>
              ) : !location && (
                <Text style={styles.calcText}>Calculando tu ubicación...</Text>
              )}

              <View style={styles.mapButtonsRow}>
                <ScaleButton
                  style={[styles.routeButton, { flex: 1 }, showRoute && styles.routeButtonActive]}
                  onPress={() => toggleRoute()}
                  disabled={!location || loadingRoute}
                >
                  <Ionicons name={showRoute ? "close-circle" : "navigate"} size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.routeButtonText}>
                    {loadingRoute ? 'Calculando...' : showRoute ? 'Ocultar Ruta' : 'Ruta'}
                  </Text>
                </ScaleButton>
                {selectedReport.status === 'verified' && (
                  <ScaleButton
                    style={styles.attendMapButton}
                    onPress={() => router.push({ pathname: '/attend-report', params: { reportId: selectedReport.id } })}
                  >
                    <Ionicons name="construct" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.routeButtonText}>Atender</Text>
                  </ScaleButton>
                )}
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F9FAFB'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  filterContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  filterPillMain: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillMainText: {
    fontWeight: '700',
    fontSize: 15,
    color: '#111827',
    marginLeft: 8,
  },
  clearFilterIcon: {
    marginLeft: 8,
    padding: 2,
  },
  filterDropdownWrapper: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
    gap: 8,
  },
  filterDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: 150,
  },
  filterDropdownItemActive: {
    backgroundColor: '#F3F4F6',
  },
  dropdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardsStack: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 120,
    zIndex: 999,
  },
  compactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  cardCategory: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    marginBottom: 16,
  },
  expandedDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  expandedMockImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  expandedMockImageText: {
    marginTop: 8,
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  expandedImage: {
    width: '100%' as any,
    height: 160,
    borderRadius: 12,
  },
  routeCompactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'space-between',
  },
  routeMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeMetricText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
  },
  calcText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center'
  },
  routeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeButtonActive: {
    backgroundColor: '#EF4444' 
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold'
  },
  mapButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attendMapButton: {
    backgroundColor: '#1D9E75',
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
