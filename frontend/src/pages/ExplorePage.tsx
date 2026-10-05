import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Navigation, List, Map as MapIcon, Store } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFavorites } from '@/hooks/useFavorites';
import { useBusinesses } from '@/hooks/useBusinesses';
import { BusinessCard } from '@/components/BusinessCard';
import { CardSkeleton, EmptyState } from '@/components/ui/Feedback';
import { FiltersBar, DEFAULT_FILTERS, type Filters } from '@/components/FiltersBar';
import { MapView } from '@/components/MapView';
import type { BusinessCategory } from '@/types';

export function ExplorePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { coords, request } = useGeolocation();
  const { isFavorite, toggle } = useFavorites();

  const [search, setSearch] = useState(params.get('q') ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    category: (params.get('category') as BusinessCategory) || null,
  });

  // Keep search in sync when navigated with a query param
  useEffect(() => {
    setSearch(params.get('q') ?? '');
    setFilters((f) => ({ ...f, category: (params.get('category') as BusinessCategory) || null }));
  }, [params]);

  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { businesses, isLoading } = useBusinesses(filters, debounced, coords);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.category) n++;
    if (filters.radius) n++;
    if (filters.minRating) n++;
    if (filters.openNow) n++;
    n += filters.services.length;
    return n;
  }, [filters]);

  return (
    <div className="space-y-5">
      {/* Search + controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar negócio..."
            className="input py-3 pl-12"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters((v) => !v)} className="btn-secondary relative">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[11px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {!coords && (
            <button onClick={() => request().catch(() => {})} className="btn-secondary">
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Localização</span>
            </button>
          )}
          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                view === 'list' ? 'bg-brand-600 text-white' : 'text-slate-500'
              }`}
            >
              <List className="h-4 w-4" /> Lista
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                view === 'map' ? 'bg-brand-600 text-white' : 'text-slate-500'
              }`}
            >
              <MapIcon className="h-4 w-4" /> Mapa
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="card animate-fade-in p-4">
          <FiltersBar filters={filters} onChange={setFilters} hasLocation={Boolean(coords)} />
        </div>
      )}

      <p className="text-sm text-slate-500">
        {isLoading ? 'Buscando...' : `${businesses.length} negócio${businesses.length === 1 ? '' : 's'} encontrado${businesses.length === 1 ? '' : 's'}`}
      </p>

      {view === 'map' ? (
        <div className="h-[70vh] overflow-hidden rounded-2xl">
          <MapView businesses={businesses} userLocation={coords} onSelect={(id) => navigate(`/business/${id}`)} />
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={Store}
          title="Nenhum negócio encontrado"
          description="Tente ajustar os filtros ou pesquisar por outro termo."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <BusinessCard key={b.id} business={b} favorite={isFavorite(b.id)} onToggleFavorite={toggle} />
          ))}
        </div>
      )}
    </div>
  );
}
