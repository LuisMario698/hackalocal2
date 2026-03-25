import React, { useEffect } from 'react';
import { UserLocation } from '../hooks/useUserLocation';
import { ReportMock, ReportCategory } from '../app/(tabs)/map';

interface Props {
  userLocation: UserLocation | null;
  reports: ReportMock[];
}

const getEmojiColor = (category: ReportCategory) => {
  switch (category) {
    case 'trash': return '🔴';
    case 'water': return '🔵';
    case 'wildlife': return '🟠';
    case 'electronic': return '🟣';
    case 'organic': return '🟢';
    default: return '⚪';
  }
};

export default function MapComponent({ userLocation, reports }: Props) {
  const { MapContainer, TileLayer, Marker, Popup, useMap } = require('react-leaflet');

  // Mini-hook para centrar Leaflet al momento que entra el permiso de GPS
  const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
    const map = useMap();
    useEffect(() => {
      map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
  };

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

  const initialLat = userLocation?.latitude || 31.3182;
  const initialLng = userLocation?.longitude || -113.5348;

  return (
    <MapContainer
      center={[initialLat, initialLng]}
      zoom={13}
      style={{ flex: 1, width: '100%', height: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {userLocation && (
        <RecenterMap lat={userLocation.latitude} lng={userLocation.longitude} />
      )}

      {/* Marcador del Usuario */}
      {userLocation && (
        <Marker position={[userLocation.latitude, userLocation.longitude]}>
          <Popup>🧑 Tú estás aquí</Popup>
        </Marker>
      )}

      {/* Marcadores de Reportes */}
      {reports.map((report) => (
        <Marker key={report.id} position={[report.latitude, report.longitude]}>
          <Popup>
            {getEmojiColor(report.category)} <b>{report.title}</b><br/>
            Categoría: {report.category}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
