import { useEffect, useRef } from 'react';
import { MapPinned } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { DEFAULT_LOCATION } from '@/hooks/useGeolocation';
import { CATEGORY_ICONS, CATEGORY_LABELS, type BusinessSummary, type Coordinates } from '@/types';
import { formatDistance } from '@/lib/format';

interface Props {
  businesses: BusinessSummary[];
  userLocation: Coordinates | null;
  onSelect: (id: number) => void;
  activeId?: number | null;
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=400&q=80';

export function MapView({ businesses, userLocation, onSelect, activeId }: Props) {
  const { ready, enabled } = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);

  const center = userLocation ?? DEFAULT_LOCATION;

  // Init map
  useEffect(() => {
    if (!ready || !mapRef.current || mapObj.current) return;
    mapObj.current = new google.maps.Map(mapRef.current, {
      center: { lat: center.latitude, lng: center.longitude },
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
    });
    infoWindow.current = new google.maps.InfoWindow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Render markers
  useEffect(() => {
    if (!ready || !mapObj.current) return;
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];

    const bounds = new google.maps.LatLngBounds();

    // user marker
    if (userLocation) {
      const um = new google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: mapObj.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        title: 'Você está aqui',
      });
      markers.current.push(um);
      bounds.extend(um.getPosition()!);
    }

    businesses.forEach((b) => {
      if (b.latitude == null || b.longitude == null) return;
      const marker = new google.maps.Marker({
        position: { lat: b.latitude, lng: b.longitude },
        map: mapObj.current!,
        title: b.name,
        label: { text: CATEGORY_ICONS[b.category], fontSize: '16px' },
      });
      marker.addListener('click', () => {
        const distance = formatDistance(b.distanceKm);
        infoWindow.current!.setContent(`
          <div style="width:220px;font-family:Inter,system-ui,sans-serif">
            <img src="${b.coverImageUrl || FALLBACK_IMG}" style="width:100%;height:110px;object-fit:cover;border-radius:8px"/>
            <div style="padding:8px 2px 2px">
              <div style="font-weight:700;font-size:14px;color:#0f172a">${b.name}</div>
              <div style="font-size:12px;color:#f59e0b;font-weight:600">★ ${b.rating.toFixed(1)} <span style="color:#94a3b8">(${b.totalReviews})</span></div>
              <div style="font-size:12px;color:#64748b;margin-top:2px">${CATEGORY_LABELS[b.category]}${distance ? ' · ' + distance : ''}</div>
              <button id="iw-btn-${b.id}" style="margin-top:8px;width:100%;background:#4f46e5;color:#fff;border:none;border-radius:8px;padding:8px;font-weight:600;font-size:13px;cursor:pointer">Ver negócio</button>
            </div>
          </div>
        `);
        infoWindow.current!.open(mapObj.current!, marker);
        google.maps.event.addListenerOnce(infoWindow.current!, 'domready', () => {
          document.getElementById(`iw-btn-${b.id}`)?.addEventListener('click', () => onSelect(b.id));
        });
      });
      markers.current.push(marker);
      bounds.extend(marker.getPosition()!);
    });

    if (!bounds.isEmpty() && businesses.length > 0) {
      mapObj.current.fitBounds(bounds, 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, businesses, userLocation]);

  // Pan to active business
  useEffect(() => {
    if (!ready || !mapObj.current || !activeId) return;
    const b = businesses.find((x) => x.id === activeId);
    if (b?.latitude != null && b?.longitude != null) {
      mapObj.current.panTo({ lat: b.latitude, lng: b.longitude });
      mapObj.current.setZoom(15);
    }
  }, [activeId, ready, businesses]);

  if (!enabled) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 bg-slate-100 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-card">
          <MapPinned className="h-7 w-7" />
        </div>
        <p className="font-semibold text-slate-700">Mapa indisponível</p>
        <p className="max-w-xs text-sm text-slate-500">
          Configure a chave <code className="rounded bg-slate-200 px-1 text-xs">VITE_GOOGLE_MAPS_API_KEY</code> para
          visualizar os negócios no mapa. A lista continua funcionando normalmente.
        </p>
      </div>
    );
  }

  if (!ready) {
    return <div className="skeleton h-full min-h-[320px] w-full" />;
  }

  return <div ref={mapRef} className="h-full min-h-[320px] w-full" />;
}
