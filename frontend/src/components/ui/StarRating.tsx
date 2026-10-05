import { Star } from 'lucide-react';

interface Props {
  value: number;
  size?: number;
  showNumber?: boolean;
  reviews?: number;
  onChange?: (value: number) => void;
  className?: string;
}

export function StarRating({ value, size = 16, showNumber = false, reviews, onChange, className = '' }: Props) {
  const interactive = Boolean(onChange);
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = value >= i - 0.25;
          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => onChange?.(i)}
              className={interactive ? 'cursor-pointer p-0.5' : 'cursor-default'}
              aria-label={`${i} estrela${i > 1 ? 's' : ''}`}
            >
              <Star
                size={size}
                className={filled ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
              />
            </button>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-sm font-semibold text-slate-700">
          {value.toFixed(1)}
          {reviews !== undefined && <span className="font-normal text-slate-400"> ({reviews})</span>}
        </span>
      )}
    </div>
  );
}
