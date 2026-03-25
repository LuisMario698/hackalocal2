import React, { useEffect } from 'react';
import { UserLocation } from '../hooks/useUserLocation';
import { ReportMock, ReportCategory } from '../app/(tabs)/map';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  userLocation: UserLocation | null;
  reports: ReportMock[];
  selectedReport: ReportMock | null;
  onSelectReport: (report: ReportMock | null) => void;
  routeCoordinates: {latitude: number; longitude: number}[];
}

export default function MapComponent({ userLocation, reports, selectedReport, onSelectReport, routeCoordinates }: Props) {
  const { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } = require('react-leaflet');

  const MapController = () => {
    const map = useMap();

    useEffect(() => {
      if (selectedReport) {
        map.flyTo([selectedReport.latitude - 0.005, selectedReport.longitude], 15, { animate: true });
      }
    }, [selectedReport, map]);

    useEffect(() => {
      const centerBtn = document.getElementById('web-locate-btn');
      if (centerBtn) {
        centerBtn.onclick = () => {
          if (userLocation) map.flyTo([userLocation.latitude, userLocation.longitude], 15, { animate: true });
        };
      }
    }, [userLocation, map]);

    useMapEvents({
      click() {
         onSelectReport(null); 
      }
    });

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
    <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={[initialLat, initialLng]}
        zoom={13}
        style={{ flex: 1, width: '100%', height: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController />

        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]}>
            <Popup>Tú estás aquí</Popup>
          </Marker>
        )}

        {reports.map((report) => (
          <Marker 
            key={report.id} 
            position={[report.latitude, report.longitude]}
            eventHandlers={{
              click: (e: any) => {
                if (e.originalEvent) {
                  e.originalEvent.stopPropagation();
                }
                onSelectReport(report);
              },
            }}
          >
          </Marker>
        ))}

        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates.map(c => [c.latitude, c.longitude])}
            pathOptions={{ color: '#3B82F6', weight: 6 }}
          />
        )}
      </MapContainer>

      {/* Botón Flotante React/DOM para Navegador */}
      <div 
        id="web-locate-btn"
        style={{
          position: 'absolute',
          right: '20px',
          bottom: '380px',
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '30px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
          zIndex: 1000,
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <MaterialIcons name="my-location" size={24} color="#1F2937" />
      </div>
    </div>
  );
}
