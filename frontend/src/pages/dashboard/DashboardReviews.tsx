import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { reviewApi } from '@/lib/services';
import { FullSpinner, EmptyState } from '@/components/ui/Feedback';
import { StarRating } from '@/components/ui/StarRating';
import { NoBusiness } from './NoBusiness';

export function DashboardReviews() {
  const { business, isLoading } = useMyBusiness();

  const { data: reviews } = useQuery({
    queryKey: ['dashboard-reviews', business?.id],
    queryFn: () => reviewApi.list(business!.id),
    enabled: Boolean(business),
  });

  if (isLoading) return <FullSpinner />;
  if (!business) return <NoBusiness />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Avaliações</h1>
        <p className="text-sm text-slate-500">O que seus clientes estão dizendo</p>
      </div>

      <div className="card flex items-center gap-6 p-6">
        <div className="text-center">
          <p className="text-4xl font-extrabold text-slate-800">{business.rating.toFixed(1)}</p>
          <StarRating value={business.rating} size={16} className="mt-1 justify-center" />
          <p className="mt-1 text-sm text-slate-500">{business.totalReviews} avaliações</p>
        </div>
      </div>

      {!reviews || reviews.length === 0 ? (
        <EmptyState icon={Star} title="Nenhuma avaliação ainda" description="As avaliações dos clientes aparecerão aqui." />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} size={14} />
                <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
