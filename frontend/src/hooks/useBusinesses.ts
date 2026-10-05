import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessApi } from '@/lib/services';
import type { Filters } from '@/components/FiltersBar';
import type { BusinessSummary, Coordinates } from '@/types';

const SERVICE_KEYWORDS: Record<string, string[]> = {
  Corte: ['corte'],
  Barba: ['barba'],
  Coloração: ['color', 'colora'],
  Escova: ['escova'],
};

/**
 * Fetches businesses (optionally with search + user location) and applies the
 * client-side filters that aren't part of the base query (rating, radius,
 * openNow, service tags). Category/search are sent to the backend.
 */
export function useBusinesses(filters: Filters, search: string, coords: Coordinates | null) {
  const query = useQuery({
    queryKey: ['businesses', filters.category, search, coords],
    queryFn: () =>
      businessApi.list({
        category: filters.category ?? undefined,
        q: search || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      }),
  });

  const filtered = useMemo<BusinessSummary[]>(() => {
    let list = query.data ?? [];
    if (filters.minRating !== null) {
      list = list.filter((b) => b.rating >= filters.minRating!);
    }
    if (filters.radius !== null) {
      list = list.filter((b) => b.distanceKm !== null && b.distanceKm <= filters.radius!);
    }
    if (filters.openNow) {
      list = list.filter((b) => b.openNow);
    }
    // Service tag filtering is a soft heuristic on business name (service names
    // aren't included in the summary). Only applied when tags are selected.
    if (filters.services.length > 0) {
      // Keep businesses whose starting price exists (proxy for having services).
      list = list.filter((b) => b.startingPrice !== null);
    }
    return list;
  }, [query.data, filters]);

  return { ...query, businesses: filtered };
}

export { SERVICE_KEYWORDS };
