import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { UserLocation } from '../hooks/useUserLocation';
import { ReportMock, ReportCategory } from '../app/(tabs)/map';

interface Props {
  userLocation: UserLocation | null;
  reports: ReportMock[];
  selectedReport: ReportMock | null;
  onSelectReport: (report: ReportMock | null) => void;
  routeCoordinates: {latitude: number; longitude: number}[];
}

const getMarkerColor = (category: ReportCategory) => {
  switch (category) {
    case 'trash': return '#EF4444';
    case 'water': return '#3B82F6';
    case 'wildlife': return '#F59E0B';
    case 'electronic': return '#8B5CF6';
    case 'organic': return '#10B981';
    default: return '#6B7280';
  }
};

export default function MapComponent({ userLocation, reports, selectedReport, onSelectReport, routeCoordinates }: Props) {
  const mapRef = useRef<MapView>(null);
  const initialLat = userLocation?.latitude || 31.3182;
  const initialLng = userLocation?.longitude || -113.5348;

  // Auto centro para reportes pulsados
  useEffect(() => {
    if (selectedReport && mapRef.current) {
       mapRef.current.animateToRegion({
         latitude: selectedReport.latitude - 0.005, // Offset
         longitude: selectedReport.longitude,
         latitudeDelta: 0.02,
         longitudeDelta: 0.02,
       }, 500);
    }
  }, [selectedReport]);

  const handleCenterUser = () => {
    if (userLocation && mapRef.current) {
       mapRef.current.animateToRegion({
         latitude: userLocation.latitude,
         longitude: userLocation.longitude,
         latitudeDelta: 0.02,
         longitudeDelta: 0.02,
       }, 500);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1, width: '100%', height: '100%' }}
        region={{
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        onPress={() => onSelectReport(null)} 
        mapPadding={{ top: 80, right: 0, bottom: 140, left: 0 }} 
      >
        {userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
            title="Tú estás aquí"
            pinColor="navy"
          />
        )}

        {reports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{ latitude: report.latitude, longitude: report.longitude }}
            pinColor={getMarkerColor(report.category)}
            onPress={(e) => {
              e.stopPropagation(); 
              onSelectReport(report);
            }}
          />
        ))}

        {/* Línea solida de ruta por la calle */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#3B82F6"
            strokeWidth={6}
            // Ya no usamos lineDashPattern falso porque a veces genera bugs invisibles en el emulador de iOS
          />
        )}
      </MapView>

      <TouchableOpacity style={styles.myLocationButton} onPress={handleCenterUser}>
        <Text style={{ fontSize: 24 }}>🎯</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  myLocationButton: {
    position: 'absolute',
    right: 20,
    bottom: 380, // Por encima de la UI del Bottom Card
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  }
});
