import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { favoriteApi } from '@/lib/services';
import { useFavorites } from '@/hooks/useFavorites';
import { BusinessCard } from '@/components/BusinessCard';
import { CardSkeleton, EmptyState } from '@/components/ui/Feedback';

export function FavoritesPage() {
  const { isFavorite, toggle } = useFavorites();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoriteApi.list(),
  });

  const handleToggle = async (id: number) => {
    await toggle(id);
    refetch();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Favoritos</h1>
        <p className="text-sm text-slate-500">Os negócios que você salvou</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nenhum favorito ainda"
          description="Toque no coração dos negócios que você gostar para encontrá-los aqui."
          action={
            <Link to="/explore" className="btn-primary">
              Explorar negócios
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((b) => (
            <BusinessCard key={b.id} business={b} favorite={isFavorite(b.id)} onToggleFavorite={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
