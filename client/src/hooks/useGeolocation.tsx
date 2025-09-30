import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface GeofenceResult {
  isInsideCampus: boolean;
  status: 'inside' | 'outside' | 'unknown';
}

const CAMPUS_BOUNDARIES = {
  center: { lat: 12.9716, lng: 77.5946 }, // Example: Bangalore coordinates
  radius: 1000 // 1km radius in meters
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const checkGeofence = (lat: number, lng: number): GeofenceResult => {
    try {
      const distance = calculateDistance(
        lat,
        lng,
        CAMPUS_BOUNDARIES.center.lat,
        CAMPUS_BOUNDARIES.center.lng
      );

      const isInsideCampus = distance <= CAMPUS_BOUNDARIES.radius;
      return {
        isInsideCampus,
        status: isInsideCampus ? 'inside' : 'outside'
      };
    } catch (error) {
      console.error('Error checking geofence:', error);
      return {
        isInsideCampus: false,
        status: 'unknown'
      };
    }
  };

  const requestLocation = async () => {
    setLocation(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const position = await getCurrentLocation();
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false,
      });
    } catch (error) {
      setLocation(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown geolocation error',
        loading: false,
      }));
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return {
    ...location,
    requestLocation,
    checkGeofence,
  };
};
