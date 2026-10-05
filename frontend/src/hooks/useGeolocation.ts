import { useCallback, useState } from 'react';
import type { Coordinates } from '@/types';

// São Paulo center as a sensible default when geolocation is unavailable/denied.
export const DEFAULT_LOCATION: Coordinates = { latitude: -23.5614, longitude: -46.6559 };

const STORAGE_KEY = 'perto.location';

function loadStored(): Coordinates | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Coordinates) : null;
  } catch {
    return null;
  }
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coordinates | null>(loadStored());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(() => {
    return new Promise<Coordinates>((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        setError('Geolocalização não suportada neste dispositivo.');
        reject(new Error('unsupported'));
        return;
      }
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c: Coordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setCoords(c);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
          setLoading(false);
          resolve(c);
        },
        (err) => {
          setLoading(false);
          setError(
            err.code === err.PERMISSION_DENIED
              ? 'Permissão de localização negada. Usando São Paulo como padrão.'
              : 'Não foi possível obter sua localização.',
          );
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }, []);

  const setManual = useCallback((c: Coordinates) => {
    setCoords(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  }, []);

  return { coords, loading, error, request, setManual };
}
