import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso para acceder a la ubicación fue denegado');
        return;
      }

      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch (error) {
        setErrorMsg('No se pudo obtener la ubicación actual.');
      }
    })();
  }, []);

  return { location, errorMsg };
}
