import { Scissors } from 'lucide-react';
import type { BusinessCategory } from '@/types';

export interface Filters {
  category: BusinessCategory | null;
  radius: number | null; // km, null = any
  minRating: number | null;
  openNow: boolean;
  services: string[];
}

export const DEFAULT_FILTERS: Filters = {
  category: null,
  radius: null,
  minRating: null,
  openNow: false,
  services: [],
};

const RADII = [1, 3, 5, 10];
const RATINGS = [4, 4.5];
const SERVICE_TAGS = ['Corte', 'Barba', 'Coloração', 'Escova'];

export function FiltersBar({
  filters,
  onChange,
  hasLocation,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  hasLocation: boolean;
}) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const toggleService = (s: string) =>
    update({
      services: filters.services.includes(s)
        ? filters.services.filter((x) => x !== s)
        : [...filters.services, s],
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ChipGroup label="Categoria">
          <Chip active={filters.category === null} onClick={() => update({ category: null })}>
            Todos
          </Chip>
          <Chip active={filters.category === 'HAIRDRESSER'} onClick={() => update({ category: 'HAIRDRESSER' })}>
            💇 Cabeleireiro
          </Chip>
          <Chip active={filters.category === 'BARBER'} onClick={() => update({ category: 'BARBER' })}>
            💈 Barbearia
          </Chip>
        </ChipGroup>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hasLocation && (
          <ChipGroup label="Distância">
            {RADII.map((r) => (
              <Chip key={r} active={filters.radius === r} onClick={() => update({ radius: filters.radius === r ? null : r })}>
                {r} km
              </Chip>
            ))}
          </ChipGroup>
        )}

        <ChipGroup label="Avaliação">
          {RATINGS.map((r) => (
            <Chip key={r} active={filters.minRating === r} onClick={() => update({ minRating: filters.minRating === r ? null : r })}>
              {r}+
            </Chip>
          ))}
        </ChipGroup>

        <Chip active={filters.openNow} onClick={() => update({ openNow: !filters.openNow })}>
          <span className={`h-1.5 w-1.5 rounded-full ${filters.openNow ? 'bg-white' : 'bg-emerald-500'}`} />
          Aberto agora
        </Chip>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ChipGroup label={<Scissors className="h-3.5 w-3.5" />}>
          {SERVICE_TAGS.map((s) => (
            <Chip key={s} active={filters.services.includes(s)} onClick={() => toggleService(s)}>
              {s}
            </Chip>
          ))}
        </ChipGroup>
      </div>
    </div>
  );
}

function ChipGroup({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="mr-1 flex items-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip border ${
        active ? 'border-brand-500 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}
