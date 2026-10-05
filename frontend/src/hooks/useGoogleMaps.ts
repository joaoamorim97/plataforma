import { useEffect, useState } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const mapsEnabled = Boolean(API_KEY);

let loadPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (!API_KEY) return Promise.reject(new Error('no-key'));
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar o Google Maps.'));
    document.head.appendChild(script);
  });
  return loadPromise;
}

/** Loads the Google Maps JS SDK. Returns { ready, error } where ready is false if no key configured. */
export function useGoogleMaps() {
  const [ready, setReady] = useState<boolean>(Boolean(window.google?.maps));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_KEY) {
      setError('no-key');
      return;
    }
    let active = true;
    loadScript()
      .then(() => active && setReady(true))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  return { ready, error, enabled: mapsEnabled };
}
