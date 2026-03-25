import React from 'react';
import { StyleSheet, View } from 'react-native';
// El bundler seleccionará automáticamente MapComponent.web.tsx en web, y MapComponent.tsx en móvil
import MapComponent from '../../components/MapComponent';

export default function MapScreen() {
  return (
    <View style={styles.mapContainer}>
      <MapComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
});
