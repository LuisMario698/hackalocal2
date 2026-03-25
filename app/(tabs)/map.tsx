import { Platform, StyleSheet, Text, View } from 'react-native';

function WebMap() {
  // react-leaflet solo funciona en web
  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');

  // Inyectar CSS de Leaflet en web
  if (typeof document !== 'undefined') {
    const linkId = 'leaflet-css';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }

  const PUERTO_PENASCO = { lat: 31.3182, lng: -113.5348 };

  return (
    <MapContainer
      center={[PUERTO_PENASCO.lat, PUERTO_PENASCO.lng]}
      zoom={13}
      style={{ flex: 1, width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[PUERTO_PENASCO.lat, PUERTO_PENASCO.lng]}>
        <Popup>Puerto Peñasco, Sonora</Popup>
      </Marker>
    </MapContainer>
  );
}

export default function MapScreen() {
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mapa no disponible</Text>
        <Text style={styles.subtitle}>
          react-leaflet solo funciona en web.{'\n'}
          Para móvil se necesita react-native-maps.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <WebMap />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  mapContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
