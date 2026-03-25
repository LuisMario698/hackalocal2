import React from 'react';
import MapView, { Marker } from 'react-native-maps';
import { UserLocation } from '../hooks/useUserLocation';
import { ReportMock, ReportCategory } from '../app/(tabs)/map';

interface Props {
  userLocation: UserLocation | null;
  reports: ReportMock[];
}

const getMarkerColor = (category: ReportCategory) => {
  switch (category) {
    case 'trash': return 'red';
    case 'water': return 'blue';
    case 'wildlife': return 'orange';
    case 'electronic': return 'purple';
    case 'organic': return 'green';
    default: return 'gray';
  }
};

export default function MapComponent({ userLocation, reports }: Props) {
  // Coordenadas fallback
  const initialLat = userLocation?.latitude || 31.3182;
  const initialLng = userLocation?.longitude || -113.5348;

  return (
    <MapView
      style={{ flex: 1, width: '100%', height: '100%' }}
      region={{
        latitude: initialLat,
        longitude: initialLng,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      showsUserLocation={true}
    >
      {/* Marcador del Usuario Explícito (adicional a showsUserLocation) */}
      {userLocation && (
        <Marker
          coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
          title="Tú estás aquí"
          pinColor="navy"
        />
      )}

      {/* Marcadores de Reportes */}
      {reports.map((report) => (
        <Marker
          key={report.id}
          coordinate={{ latitude: report.latitude, longitude: report.longitude }}
          title={report.title}
          description={`Categoría: ${report.category}`}
          pinColor={getMarkerColor(report.category)}
        />
      ))}
    </MapView>
  );
}
