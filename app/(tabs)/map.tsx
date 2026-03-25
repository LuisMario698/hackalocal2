import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapComponent from '../../components/MapComponent';
import { useUserLocation } from '../../hooks/useUserLocation';

export type ReportCategory = 'trash' | 'water' | 'wildlife' | 'electronic' | 'organic' | 'other';

export interface ReportMock {
  id: string;
  title: string;
  category: ReportCategory;
  latitude: number;
  longitude: number;
}

const MOCK_REPORTS: ReportMock[] = [
  { id: '1', title: 'Basura en la playa', category: 'trash', latitude: 31.3012, longitude: -113.5358 },
  { id: '2', title: 'Fuga de agua masiva', category: 'water', latitude: 31.3100, longitude: -113.5400 },
  { id: '3', title: 'Desechos orgánicos', category: 'organic', latitude: 31.3250, longitude: -113.5200 },
  { id: '4', title: 'TV vieja abandonada', category: 'electronic', latitude: 31.3180, longitude: -113.5100 },
  { id: '5', title: 'Pelícano herido', category: 'wildlife', latitude: 31.3050, longitude: -113.5500 },
];

const CATEGORIES = [
  { id: 'all', label: 'Todos', color: '#1F2937' },
  { id: 'trash', label: 'Basura', color: '#EF4444' },
  { id: 'water', label: 'Agua', color: '#3B82F6' },
  { id: 'wildlife', label: 'Fauna', color: '#F59E0B' },
  { id: 'electronic', label: 'Electr.', color: '#8B5CF6' },
  { id: 'organic', label: 'Orgánico', color: '#10B981' },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function MapScreen() {
  const { location, errorMsg } = useUserLocation();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<ReportMock | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);
  const insets = useSafeAreaInsets();

  const filteredReports = activeFilter === 'all' 
    ? MOCK_REPORTS 
    : MOCK_REPORTS.filter(r => r.category === activeFilter);

  const handleFilterPress = (catId: string) => {
    setActiveFilter(catId);
    setSelectedReport(null);
    setShowRoute(false);
    setRouteCoords([]);
  };

  const handleSelectReport = (report: ReportMock | null) => {
    setSelectedReport(report);
    // Siempe que haya nuevo reporte seleccionado, limpia el viejo trayecto
    setShowRoute(false);
    setRouteCoords([]);
  };

  const [loadingRoute, setLoadingRoute] = useState(false);

  const toggleRoute = async () => {
    if (showRoute) {
      setShowRoute(false);
      setRouteCoords([]);
      return;
    }

    if (!location || !selectedReport) return;

    setShowRoute(true);
    setLoadingRoute(true);

    const fallback = [
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: selectedReport.latitude, longitude: selectedReport.longitude },
    ];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = `https://router.project-osrm.org/route/v1/driving/${location.longitude},${location.latitude};${selectedReport.longitude},${selectedReport.latitude}?overview=full&geometries=geojson`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map((coord: number[]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRouteCoords(coords);
      } else {
        setRouteCoords(fallback);
      }
    } catch (e) {
      setRouteCoords(fallback);
    } finally {
      setLoadingRoute(false);
    }
  };

  let distanceKm = 0;
  let timeMins = 0;

  if (selectedReport && location) {
    distanceKm = calculateDistance(location.latitude, location.longitude, selectedReport.latitude, selectedReport.longitude);
    timeMins = Math.round((distanceKm / 40) * 60); 
    if (timeMins < 1) timeMins = 1;
  }

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: '#EF4444', textAlign: 'center', fontWeight: 'bold' }}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <View style={[styles.filterContainer, { top: insets.top || 10 }]} pointerEvents="box-none">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll} keyboardShouldPersistTaps="handled">
          {CATEGORIES.map(cat => {
            const isActive = activeFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterPill,
                  isActive ? { backgroundColor: cat.color, borderColor: cat.color } : { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }
                ]}
                onPress={() => handleFilterPress(cat.id)}
              >
                <Text style={{ 
                  color: isActive ? '#FFFFFF' : '#4B5563', 
                  fontWeight: isActive ? 'bold' : '600',
                  fontSize: 14 
                }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      <MapComponent 
        userLocation={location} 
        reports={filteredReports} 
        selectedReport={selectedReport}
        onSelectReport={handleSelectReport}
        routeCoordinates={showRoute ? routeCoords : []}
      />

      {selectedReport && (
        <View style={[styles.bottomCard, { bottom: 120 }]} pointerEvents="box-none">
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>{selectedReport.title}</Text>
              <Text style={styles.cardCategory}>Categoría: {CATEGORIES.find(c => c.id === selectedReport.category)?.label}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => handleSelectReport(null)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {location ? (
            <View style={styles.metricsContainer}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Distancia</Text>
                <Text style={styles.metricValue}>{distanceKm.toFixed(2)} km</Text>
              </View>
              <View style={styles.metricSeparator} />
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Tiempo Est. (Auto)</Text>
                <Text style={styles.metricValue}>{timeMins} min</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.calcText}>Calculando tu ubicación...</Text>
          )}

          <TouchableOpacity
            style={[styles.routeButton, showRoute && styles.routeButtonActive]}
            onPress={toggleRoute}
            disabled={!location || loadingRoute}
          >
            <Text style={styles.routeButtonText}>
              {loadingRoute ? 'Calculando ruta...' : showRoute ? 'Ocultar Ruta' : 'Trazar Ruta en el Mapa'}
            </Text>
          </TouchableOpacity>
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
    zIndex: 999,
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  bottomCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 999,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardCategory: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: 'bold'
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20
  },
  metricBox: {
    alignItems: 'center',
    flex: 1
  },
  metricSeparator: {
    width: 1,
    backgroundColor: '#D1D5DB'
  },
  metricLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827'
  },
  calcText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center'
  },
  routeButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center'
  },
  routeButtonActive: {
    backgroundColor: '#EF4444' 
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
