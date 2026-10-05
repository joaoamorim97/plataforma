import { useCallback, useEffect, useState } from 'react';
import { favoriteApi } from '@/lib/services';
import { useAuth } from '@/auth/AuthContext';

/** Manages the set of favorited business ids for the current user. */
export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const [ids, setIds] = useState<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setIds(new Set());
      return;
    }
    try {
      const list = await favoriteApi.ids();
      setIds(new Set(list));
    } catch {
      /* ignore */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (businessId: number) => {
      const next = new Set(ids);
      const isFav = next.has(businessId);
      // optimistic update
      if (isFav) next.delete(businessId);
      else next.add(businessId);
      setIds(next);
      try {
        if (isFav) await favoriteApi.remove(businessId);
        else await favoriteApi.add(businessId);
      } catch {
        refresh();
      }
    },
    [ids, refresh],
  );

  return { ids, isFavorite: (id: number) => ids.has(id), toggle, refresh };
}
