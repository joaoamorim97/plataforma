import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Navigation, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { businessApi } from '@/lib/services';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFavorites } from '@/hooks/useFavorites';
import { BusinessCard } from '@/components/BusinessCard';
import { CardSkeleton } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import type { BusinessCategory } from '@/types';

const categories: { key: BusinessCategory; label: string; emoji: string }[] = [
  { key: 'HAIRDRESSER', label: 'Cabeleireiros', emoji: '💇' },
  { key: 'BARBER', label: 'Barbearias', emoji: '💈' },
];

const futureCategories = [
  { label: 'Pubs', emoji: '🍻' },
  { label: 'Restaurantes', emoji: '🍽️' },
  { label: 'Academias', emoji: '💪' },
  { label: 'Clínicas', emoji: '🏥' },
];

export function HomePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { coords, request, loading: geoLoading } = useGeolocation();
  const { isFavorite, toggle } = useFavorites();
  const [search, setSearch] = useState('');

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['home-businesses', coords],
    queryFn: () =>
      businessApi.list({
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      }),
  });

  const handleFindNearby = async () => {
    try {
      await request();
      navigate('/explore');
    } catch {
      toast.info('Mostrando negócios em São Paulo.');
      navigate('/explore');
    }
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/explore?q=${encodeURIComponent(search)}`);
  };

  const featured = businesses?.slice(0, 3) ?? [];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 px-6 py-12 text-white sm:px-12 sm:py-16">
        <div className="relative z-10 max-w-2xl">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Negócios locais perto de você
          </span>
          <h1 className="text-3xl font-extrabold leading-tight sm:text-5xl">
            Encontre lugares incríveis perto de você.
          </h1>
          <p className="mt-4 text-base text-brand-100 sm:text-lg">
            Descubra cabeleireiros e barbearias próximos, veja serviços, preços e horários, e entre em contato em segundos.
          </p>

          <form onSubmit={onSearch} className="mt-7 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar negócio..."
                className="h-13 w-full rounded-2xl border-0 bg-white py-3.5 pl-12 pr-4 text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={handleFindNearby}
              disabled={geoLoading}
              className="btn inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-semibold text-brand-700 hover:bg-brand-50"
            >
              <Navigation className="h-4 w-4" />
              {geoLoading ? 'Localizando...' : 'Perto de mim'}
            </button>
          </form>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-72 w-72 rounded-full bg-white/5" />
      </section>

      {/* Categories */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-800">Categorias</h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => navigate(`/explore?category=${c.key}`)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:border-brand-300 hover:shadow-card"
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="font-semibold text-slate-700">{c.label}</span>
            </button>
          ))}
          {futureCategories.map((c) => (
            <div
              key={c.label}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-4 text-left"
            >
              <span className="text-2xl opacity-50">{c.emoji}</span>
              <div>
                <span className="block font-semibold text-slate-400">{c.label}</span>
                <span className="text-[11px] text-slate-400">Em breve</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Destaques perto de você</h2>
          <button onClick={() => navigate('/explore')} className="text-sm font-semibold text-brand-600 hover:underline">
            Ver todos
          </button>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : featured.map((b) => (
                <BusinessCard key={b.id} business={b} favorite={isFavorite(b.id)} onToggleFavorite={toggle} />
              ))}
        </div>
      </section>

      {!coords && (
        <div className="flex items-center gap-3 rounded-2xl bg-brand-50 px-5 py-4 text-sm text-brand-800">
          <MapPin className="h-5 w-5 shrink-0" />
          Ative sua localização para ver as distâncias e os negócios mais próximos de você.
        </div>
      )}
    </div>
  );
}
