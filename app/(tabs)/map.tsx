import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
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
  { id: 'all', label: 'Todos', color: '#333333' },
  { id: 'trash', label: 'Basura', color: '#E24B4A' },
  { id: 'water', label: 'Agua', color: '#378ADD' },
  { id: 'wildlife', label: 'Fauna', color: '#BA7517' },
  { id: 'electronic', label: 'Electrónico', color: '#7F77DD' },
  { id: 'organic', label: 'Orgánico', color: '#1D9E75' },
];

export default function MapScreen() {
  const { location, errorMsg } = useUserLocation();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const insets = useSafeAreaInsets();

  const filteredReports = activeFilter === 'all' 
    ? MOCK_REPORTS 
    : MOCK_REPORTS.filter(r => r.category === activeFilter);

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: 'red', textAlign: 'center' }}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      
      {/* Píldoras de Filtrado Flotantes */}
      <View style={[styles.filterContainer, { top: insets.top || 20 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map(cat => {
            const isActive = activeFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterPill,
                  { borderColor: cat.color },
                  isActive && { backgroundColor: cat.color }
                ]}
                onPress={() => setActiveFilter(cat.id)}
              >
                <Text style={{ 
                  color: isActive ? 'white' : cat.color, 
                  fontWeight: '600',
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
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
    zIndex: 999, // Arriba de react-native-maps y react-leaflet
  },
  filterScroll: {
    paddingHorizontal: 15,
    paddingBottom: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  }
});
