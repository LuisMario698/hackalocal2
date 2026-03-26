// Versión web — placeholder sin react-native-maps
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './ScaledText';
import { Colors } from '../constants/Colors';

interface Props {
  userLat: number;
  userLng: number;
  pinCoord: { latitude: number; longitude: number } | null;
  onPress: (e: any) => void;
  mapRef?: any;
  maxDistance?: number;
}

export default function ReportMapPicker({ pinCoord }: Props) {
  return (
    <View style={styles.mapWrap}>
      <Ionicons name="map-outline" size={36} color={Colors.primary} />
      <Text style={styles.text}>
        {pinCoord
          ? `Pin: ${pinCoord.latitude.toFixed(5)}, ${pinCoord.longitude.toFixed(5)}`
          : 'Mapa no disponible en web — usa la app móvil para seleccionar ubicación'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  text: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
