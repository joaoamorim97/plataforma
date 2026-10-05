import { Heart, MapPin } from 'lucide-react';
import type { BusinessSummary } from '@/types';
import { CATEGORY_LABELS } from '@/types';
import { StarRating } from './ui/StarRating';
import { formatDistance, formatPrice } from '@/lib/format';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&q=80';

interface Props {
  business: BusinessSummary;
  favorite: boolean;
  onToggleFavorite: (id: number) => void;
  onHover: () => void;
  onClick: () => void;
}

export function MapListItem({ business, favorite, onToggleFavorite, onHover, onClick }: Props) {
  const distance = formatDistance(business.distanceKm);
  return (
    <div
      onMouseEnter={onHover}
      onClick={onClick}
      className="flex cursor-pointer gap-3 rounded-2xl bg-white p-3 shadow-card transition hover:shadow-card-hover"
    >
      <img
        src={business.coverImageUrl || FALLBACK_IMG}
        alt={business.name}
        loading="lazy"
        className="h-24 w-24 shrink-0 rounded-xl object-cover"
        onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_IMG)}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-slate-800">{business.name}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(business.id);
            }}
            className="shrink-0 text-slate-400 hover:text-red-500"
            aria-label="Favoritar"
          >
            <Heart className={`h-5 w-5 ${favorite ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
        <StarRating value={business.rating} showNumber reviews={business.totalReviews} size={13} className="mt-0.5" />
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">
            {CATEGORY_LABELS[business.category]}
            {distance && ` · ${distance}`}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              business.openNow ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {business.openNow ? 'Aberto' : 'Fechado'}
          </span>
          {business.startingPrice !== null && (
            <span className="text-xs text-slate-600">A partir de {formatPrice(business.startingPrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
