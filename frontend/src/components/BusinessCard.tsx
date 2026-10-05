import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import type { BusinessSummary } from '@/types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/types';
import { StarRating } from './ui/StarRating';
import { formatDistance, formatPrice } from '@/lib/format';

interface Props {
  business: BusinessSummary;
  favorite?: boolean;
  onToggleFavorite?: (id: number) => void;
}

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80';

export function BusinessCard({ business, favorite, onToggleFavorite }: Props) {
  const distance = formatDistance(business.distanceKm);

  return (
    <div className="card group overflow-hidden transition-shadow hover:shadow-card-hover animate-fade-in">
      <div className="relative">
        <Link to={`/business/${business.id}`}>
          <img
            src={business.coverImageUrl || FALLBACK_IMG}
            alt={business.name}
            loading="lazy"
            className="h-44 w-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_IMG)}
          />
        </Link>
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 backdrop-blur">
          <span>{CATEGORY_ICONS[business.category]}</span>
          {CATEGORY_LABELS[business.category]}
        </div>
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(business.id)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 backdrop-blur transition hover:scale-105"
            aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={`h-5 w-5 ${favorite ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        )}
        <div className="absolute bottom-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white backdrop-blur ${
              business.openNow ? 'bg-emerald-500/90' : 'bg-slate-500/80'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${business.openNow ? 'bg-white' : 'bg-slate-200'}`} />
            {business.openNow ? 'Aberto agora' : 'Fechado'}
          </span>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/business/${business.id}`} className="font-semibold text-slate-800 hover:text-brand-600">
            {business.name}
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <StarRating value={business.rating} showNumber reviews={business.totalReviews} size={14} />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-4 w-4" />
          <span className="truncate">
            {business.neighborhood || business.city || 'São Paulo'}
            {distance && <span className="text-slate-400"> · {distance}</span>}
          </span>
        </div>
        {business.startingPrice !== null && (
          <p className="text-sm text-slate-600">
            A partir de <span className="font-semibold text-slate-800">{formatPrice(business.startingPrice)}</span>
          </p>
        )}
        <Link to={`/business/${business.id}`} className="btn-primary mt-1 w-full">
          Ver negócio
        </Link>
      </div>
    </div>
  );
}
