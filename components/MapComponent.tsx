import React from 'react';
import MapView, { Marker } from 'react-native-maps';

export default function MapComponent() {
  const PUERTO_PENASCO = { lat: 31.3182, lng: -113.5348 };

  return (
    <MapView
      style={{ flex: 1, width: '100%', height: '100%' }}
      initialRegion={{
        latitude: PUERTO_PENASCO.lat,
        longitude: PUERTO_PENASCO.lng,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
    >
      <Marker
        coordinate={{ latitude: PUERTO_PENASCO.lat, longitude: PUERTO_PENASCO.lng }}
        title="Puerto Peñasco"
        description="Sonora, México"
      />
    </MapView>
  );
}
