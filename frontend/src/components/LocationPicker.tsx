import { useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { DEFAULT_LOCATION } from '@/hooks/useGeolocation';

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: Props) {
  const { ready, enabled } = useGoogleMaps();
  const ref = useRef<HTMLDivElement>(null);
  const mapObj = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.Marker | null>(null);

  const center = {
    lat: latitude ?? DEFAULT_LOCATION.latitude,
    lng: longitude ?? DEFAULT_LOCATION.longitude,
  };

  useEffect(() => {
    if (!ready || !ref.current || mapObj.current) return;
    mapObj.current = new google.maps.Map(ref.current, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
    });
    marker.current = new google.maps.Marker({
      position: center,
      map: mapObj.current,
      draggable: true,
    });
    if (latitude == null) marker.current.setMap(null);

    mapObj.current.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      place(lat, lng);
      onChange(lat, lng);
    });
    marker.current.addListener('dragend', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      onChange(e.latLng.lat(), e.latLng.lng());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // External updates (e.g. "use my location")
  useEffect(() => {
    if (!ready || !mapObj.current || latitude == null || longitude == null) return;
    place(latitude, longitude);
    mapObj.current.panTo({ lat: latitude, lng: longitude });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, ready]);

  function place(lat: number, lng: number) {
    if (!marker.current || !mapObj.current) return;
    marker.current.setPosition({ lat, lng });
    marker.current.setMap(mapObj.current);
  }

  if (!enabled) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Latitude</label>
          <input
            type="number"
            step="any"
            value={latitude ?? ''}
            onChange={(e) => onChange(Number(e.target.value), longitude ?? DEFAULT_LOCATION.longitude)}
            className="input"
            placeholder="-23.561"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Longitude</label>
          <input
            type="number"
            step="any"
            value={longitude ?? ''}
            onChange={(e) => onChange(latitude ?? DEFAULT_LOCATION.latitude, Number(e.target.value))}
            className="input"
            placeholder="-46.656"
          />
        </div>
        <p className="text-xs text-slate-400 sm:col-span-2">
          Configure a chave do Google Maps para selecionar a localização visualmente no mapa.
        </p>
      </div>
    );
  }

  if (!ready) return <div className="skeleton h-64 w-full" />;

  return <div ref={ref} className="h-64 w-full overflow-hidden rounded-xl" />;
}
