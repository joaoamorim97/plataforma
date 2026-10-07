import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessApi } from '@/lib/services';
import type { BusinessDetail } from '@/types';

const SELECTED_KEY = 'perto.selectedBusiness';

interface MyBusinessState {
  businesses: BusinessDetail[];
  business: BusinessDetail | null;
  selectedId: number | null;
  selectBusiness: (id: number) => void;
  isLoading: boolean;
  refetch: () => void;
}

const MyBusinessContext = createContext<MyBusinessState | undefined>(undefined);

export function MyBusinessProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ['my-business'],
    queryFn: () => businessApi.mine(),
  });

  const businesses = query.data ?? [];

  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const raw = localStorage.getItem(SELECTED_KEY);
    return raw ? Number(raw) : null;
  });

  // Garante que o selecionado existe na lista; senão, cai no primeiro.
  useEffect(() => {
    if (businesses.length === 0) return;
    const exists = selectedId != null && businesses.some((b) => b.id === selectedId);
    if (!exists) {
      setSelectedId(businesses[0].id);
    }
  }, [businesses, selectedId]);

  const selectBusiness = (id: number) => {
    setSelectedId(id);
    localStorage.setItem(SELECTED_KEY, String(id));
  };

  const business = useMemo(
    () => businesses.find((b) => b.id === selectedId) ?? businesses[0] ?? null,
    [businesses, selectedId],
  );

  const value: MyBusinessState = {
    businesses,
    business,
    selectedId: business?.id ?? null,
    selectBusiness,
    isLoading: query.isLoading,
    refetch: () => query.refetch(),
  };

  return createElement(MyBusinessContext.Provider, { value }, children);
}

export function useMyBusiness(): MyBusinessState {
  const ctx = useContext(MyBusinessContext);
  if (!ctx) {
    throw new Error('useMyBusiness must be used within MyBusinessProvider');
  }
  return ctx;
}
