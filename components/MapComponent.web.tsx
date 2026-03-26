import React, { useEffect, useMemo } from 'react';
import { UserLocation } from '../hooks/useUserLocation';
import { ReportMock } from '../app/(tabs)/map';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  userLocation: UserLocation | null;
  reports: ReportMock[];
  selectedReport: ReportMock | null;
  onSelectReport: (report: ReportMock | null) => void;
  routeCoordinates: { latitude: number; longitude: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  trash: '#EF4444',
  water: '#3B82F6',
  wildlife: '#F59E0B',
  electronic: '#8B5CF6',
  organic: '#10B981',
  other: '#6B7280',
};

// Leaflet solo existe en browser — lo cargamos una vez a nivel de módulo
const L = typeof window !== 'undefined' ? require('leaflet') : null;

function pinIcon(color: string, selected: boolean, dimmed: boolean) {
  const r = selected ? 14 : 11;
  const tip = selected ? 10 : 8;
  const total = r * 2 + tip;
  const border = selected ? 3 : 2;

  const html = `
    <div style="
      position:relative;
      width:${r * 2}px;
      height:${total}px;
      opacity:${dimmed ? 0.35 : 1};
      filter:${dimmed ? 'grayscale(45%)' : 'none'};
    ">
      <div style="
        position:absolute;
        top:0; left:0;
        width:${r * 2}px;
        height:${r * 2}px;
        background:${color};
        border:${border}px solid #fff;
        border-radius:50%;
        box-shadow:0 2px 8px rgba(0,0,0,0.28);
      "></div>
      <div style="
        position:absolute;
        bottom:0;
        left:${r - 4}px;
        width:0; height:0;
        border-left:4px solid transparent;
        border-right:4px solid transparent;
        border-top:${tip}px solid ${color};
      "></div>
    </div>`;

  return L.divIcon({
    html,
    iconSize: [r * 2, total],
    iconAnchor: [r, total],
    className: '',
  });
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
  return L.divIcon({
    html,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    className: '',
  });
}

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

export default function MapComponent({
  userLocation,
  reports,
  selectedReport,
  onSelectReport,
  routeCoordinates,
}: Props) {
  if (!L) return null;

  const { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } =
    require('react-leaflet');

  const userIcon = useMemo(() => userDotIcon(), []);

  const MapController = () => {
    const map = useMap();

    useEffect(() => {
      if (selectedReport) {
        map.flyTo(
          [selectedReport.latitude - 0.004, selectedReport.longitude],
          15,
          { animate: true, duration: 0.7 }
        );
      }
    }, [selectedReport]);

    useEffect(() => {
      const btn = document.getElementById('web-locate-btn');
      if (btn) {
        btn.onclick = () => {
          if (userLocation)
            map.flyTo([userLocation.latitude, userLocation.longitude], 15, {
              animate: true,
              duration: 0.7,
            });
        };
      }
    }, [userLocation]);

    useMapEvents({ click: () => onSelectReport(null) });
    return null;
  };

  const lat = userLocation?.latitude ?? 31.3182;
  const lng = userLocation?.longitude ?? -113.5348;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        zoomControl={false}
        inertia={true}
        inertiaDeceleration={2400}
        inertiaMaxSpeed={800}
        easeLinearity={0.15}
        wheelPxPerZoomLevel={140}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
        />

        <MapController />

        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userIcon}
          />
        )}

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={pinIcon(
              CATEGORY_COLORS[report.category] ?? CATEGORY_COLORS.other,
              selectedReport?.id === report.id,
              !!selectedReport && selectedReport.id !== report.id
            )}
            eventHandlers={{
              click: (e: any) => {
                e.originalEvent?.stopPropagation();
                onSelectReport(report);
              },
            }}
          />
        ))}

        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates.map((c) => [c.latitude, c.longitude])}
            pathOptions={{ color: '#147EFB', weight: 5, opacity: 0.9 }}
          />
        )}
      </MapContainer>

      <div
        id="web-locate-btn"
        style={{
          position: 'absolute',
          right: 20,
          bottom: 380,
          backgroundColor: '#fff',
          padding: 12,
          borderRadius: 30,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name="my-location" size={24} color="#1F2937" />
      </div>
    </div>
  );
}
