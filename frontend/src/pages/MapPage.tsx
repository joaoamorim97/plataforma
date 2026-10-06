import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Store } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFavorites } from '@/hooks/useFavorites';
import { useBusinesses } from '@/hooks/useBusinesses';
import { MapView } from '@/components/MapView';
import { FiltersBar, DEFAULT_FILTERS, type Filters } from '@/components/FiltersBar';
import { EmptyState, CardSkeleton } from '@/components/ui/Feedback';
import { MapListItem } from '@/components/MapListItem';
import { useI18n } from '@/i18n/I18nContext';

export function MapPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { coords, request } = useGeolocation();
  const { isFavorite, toggle } = useFavorites();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activeId, setActiveId] = useState<number | null>(null);

  const { businesses, isLoading } = useBusinesses(filters, '', coords);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('map.title')}</h1>
          <p className="text-sm text-slate-500">{t('map.subtitle')}</p>
        </div>
        {!coords && (
          <button onClick={() => request().catch(() => {})} className="btn-secondary">
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">{t('map.myLocation')}</span>
          </button>
        )}
      </div>

      <div className="card p-4">
        <FiltersBar filters={filters} onChange={setFilters} hasLocation={Boolean(coords)} />
      </div>

      {/* Desktop: side-by-side. Mobile: map on top, list below. */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-[45vh] overflow-hidden rounded-2xl lg:h-[72vh] lg:sticky lg:top-20">
          <MapView
            businesses={businesses}
            userLocation={coords}
            activeId={activeId}
            onSelect={(id) => navigate(`/business/${id}`)}
          />
        </div>

        <div className="space-y-3 lg:max-h-[72vh] lg:overflow-y-auto lg:pr-1">
          <h2 className="text-sm font-semibold text-slate-700">
            {isLoading ? t('common.loading') : `${businesses.length} ${t('map.results')}`}
          </h2>
          {isLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : businesses.length === 0 ? (
            <EmptyState icon={Store} title={t('map.emptyTitle')} description={t('map.emptyDesc')} />
          ) : (
            businesses.map((b) => (
              <MapListItem
                key={b.id}
                business={b}
                favorite={isFavorite(b.id)}
                onToggleFavorite={toggle}
                onHover={() => setActiveId(b.id)}
                onClick={() => navigate(`/business/${b.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
