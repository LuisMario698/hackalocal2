// Versión nativa — usa react-native-maps
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { Colors } from '../constants/Colors';

interface Props {
  userLat: number;
  userLng: number;
  pinCoord: { latitude: number; longitude: number } | null;
  onPress: (e: any) => void;
  mapRef?: React.RefObject<MapView>;
  maxDistance?: number;
}

export default function ReportMapPicker({ userLat, userLng, pinCoord, onPress, mapRef, maxDistance = 500 }: Props) {
  return (
    <View style={styles.mapWrap}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLat,
          longitude: userLng,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        showsUserLocation
        onPress={onPress}
      >
        <Circle
          center={{ latitude: userLat, longitude: userLng }}
          radius={maxDistance}
          fillColor="rgba(29,158,117,0.10)"
          strokeColor="rgba(29,158,117,0.35)"
          strokeWidth={2}
        />
        {pinCoord && (
          <Marker
            coordinate={pinCoord}
            pinColor={Colors.accent}
            title="Ubicacion del reporte"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  map: {
    flex: 1,
  },
});
