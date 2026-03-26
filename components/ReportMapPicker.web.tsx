// Versión web — Implementación interactiva con react-leaflet
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface Props {
  userLat: number;
  userLng: number;
  pinCoord: { latitude: number; longitude: number } | null;
  onPress: (e: any) => void;
  mapRef?: any;
  maxDistance?: number;
}

const L = typeof window !== 'undefined' ? require('leaflet') : null;

if (typeof document !== 'undefined') {
  const id = 'leaflet-css';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
}

function userDotIcon() {
  const html = `
    <div style="
      width:16px; height:16px;
      background:#147EFB;
      border:2.5px solid #fff;
      border-radius:50%;
      box-shadow:0 0 0 5px rgba(20,126,251,0.18), 0 2px 6px rgba(0,0,0,0.25);
    "></div>`;
  if (!L) return null;
  return L.divIcon({ html, iconSize: [16, 16], iconAnchor: [8, 8], className: '' });
}

function selectPinIcon() {
  const html = `
    <div style="
      position:relative; width:44px; height:44px;
      display:flex; align-items:center; justify-content:center;
    ">
      <div style="
        font-size:36px; color:${Colors.primary};
        filter: drop-shadow(0px 4px 8px rgba(0,0,0,0.4));
      ">📍</div>
    </div>`;
  if (!L) return null;
  return L.divIcon({ html, iconSize: [44, 44], iconAnchor: [22, 44], className: '' });
}

export default function ReportMapPicker({ userLat, userLng, pinCoord, onPress, maxDistance = 500 }: Props) {
  if (!L) return <View style={styles.mapWrap}><span style={{padding:20,color:'#9CA3AF'}}>Cargando mapa...</span></View>;

  const { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } = require('react-leaflet');
  const userIcon = useMemo(() => userDotIcon(), []);
  const pinIcon = useMemo(() => selectPinIcon(), []);

  const MapController = () => {
    const map = useMap();
    useMapEvents({
      click: (e: any) => {
        onPress({ nativeEvent: { coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } } });
      }
    });

    useEffect(() => {
      const btn = document.getElementById('web-locate-picker-btn');
      if (btn) {
        btn.onclick = () => {
          map.flyTo([userLat, userLng], 15, { animate: true, duration: 0.7 });
        };
      }
    }, [userLat, userLng]);

    return null;
  };

  return (
    <View style={styles.mapWrap}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <MapContainer
          center={[userLat, userLng]}
          zoom={14}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
          zoomControl={false}
          inertia={true}
          preferCanvas={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
            url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
          />
          <MapController />

          {/* Tu Ubicación */}
          <Marker position={[userLat, userLng]} icon={userIcon} />

          {/* Rango máximo (se oculta si maxDistance es gigante, ej. modo institucional) */}
          {maxDistance < 100000 && (
            <Circle
              center={[userLat, userLng]}
              radius={maxDistance}
              pathOptions={{ fillColor: Colors.primary, color: Colors.primary, fillOpacity: 0.1, weight: 1.5 }}
            />
          )}

          {/* Ubicación Marcada */}
          {pinCoord && (
            <Marker position={[pinCoord.latitude, pinCoord.longitude]} icon={pinIcon} />
          )}
        </MapContainer>

        <div
          id="web-locate-picker-btn"
          style={{
            position: 'absolute', right: 12, bottom: 12,
            backgroundColor: '#fff', padding: 8, borderRadius: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 1000,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <MaterialIcons name="my-location" size={24} color="#1F2937" />
        </div>
      </div>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
