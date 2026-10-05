import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Heart, MapPin, Phone, MessageCircle, Navigation, Clock, Star, Share2, ChevronLeft, ChevronRight, CalendarPlus,
} from 'lucide-react';
import { businessApi, reviewApi, favoriteApi } from '@/lib/services';
import { BookingModal } from '@/components/BookingModal';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { StarRating } from '@/components/ui/StarRating';
import { FullSpinner } from '@/components/ui/Feedback';
import { formatDistance, formatDuration, formatPrice } from '@/lib/format';
import { CATEGORY_ICONS, CATEGORY_LABELS, DAY_LABELS } from '@/types';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80';

export function BusinessPage() {
  const { id } = useParams();
  const businessId = Number(id);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { coords } = useGeolocation();
  const { isAuthenticated, userId } = useAuth();

  const [favorite, setFavorite] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showBooking, setShowBooking] = useState(false);

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', businessId, coords],
    queryFn: () => businessApi.get(businessId, { latitude: coords?.latitude, longitude: coords?.longitude }),
    enabled: Number.isFinite(businessId),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', businessId],
    queryFn: () => reviewApi.list(businessId),
    enabled: Number.isFinite(businessId),
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    favoriteApi.ids().then((ids) => setFavorite(ids.includes(businessId))).catch(() => {});
  }, [isAuthenticated, businessId]);

  if (isLoading) return <FullSpinner label="Carregando negócio..." />;
  if (!business) {
    return (
      <div className="py-20 text-center text-slate-500">
        Negócio não encontrado.{' '}
        <Link to="/explore" className="font-semibold text-brand-600">
          Voltar
        </Link>
      </div>
    );
  }

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/business/${businessId}` } });
      return;
    }
    setFavorite((f) => !f);
    try {
      if (favorite) await favoriteApi.remove(businessId);
      else await favoriteApi.add(businessId);
    } catch {
      setFavorite((f) => !f);
      toast.error('Não foi possível atualizar os favoritos.');
    }
  };

  const images = business.images.length > 0 ? business.images : [{ id: 0, imageUrl: business.coverImageUrl || FALLBACK_IMG, cover: true }];
  const cover = images[galleryIndex]?.imageUrl || FALLBACK_IMG;

  const mapsUrl = business.latitude && business.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [business.address, business.addressNumber, business.city, business.state].filter(Boolean).join(', '),
      )}`;

  const whatsappUrl = business.whatsapp
    ? `https://wa.me/${business.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Vi o ${business.name} no Perto e gostaria de mais informações.`)}`
    : null;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: business.name, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado!');
      }
    } catch {
      /* cancelled */
    }
  };

  const distance = formatDistance(business.distanceKm);

  return (
    <div className="animate-fade-in space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex gap-2">
          <button onClick={share} className="btn-secondary">
            <Share2 className="h-4 w-4" />
          </button>
          <button onClick={toggleFavorite} className="btn-secondary">
            <Heart className={`h-4 w-4 ${favorite ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero gallery */}
      <div className="relative overflow-hidden rounded-3xl">
        <img src={cover} alt={business.name} className="h-64 w-full object-cover sm:h-96" onError={(e) => ((e.target as HTMLImageElement).src = FALLBACK_IMG)} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setGalleryIndex((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setGalleryIndex((i) => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white sm:p-8">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
              {CATEGORY_ICONS[business.category]} {CATEGORY_LABELS[business.category]}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                business.openNow ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {business.openNow ? 'Aberto agora' : 'Fechado'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold sm:text-4xl">{business.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{business.rating.toFixed(1)}</span>
              <span className="text-white/70">({business.totalReviews} avaliações)</span>
            </span>
            <span className="flex items-center gap-1.5 text-white/90">
              <MapPin className="h-4 w-4" />
              {business.neighborhood || business.city}
              {distance && ` · ${distance}`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* About */}
          {business.description && (
            <section className="card p-5">
              <h2 className="mb-2 text-lg font-bold text-slate-800">Sobre</h2>
              <p className="text-sm leading-relaxed text-slate-600">{business.description}</p>
            </section>
          )}

          {/* Services */}
          <section className="card p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Serviços</h2>
            {business.services.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum serviço cadastrado ainda.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {business.services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-slate-800">{s.name}</p>
                      {s.description && <p className="text-xs text-slate-500">{s.description}</p>}
                      {s.durationMinutes ? <p className="text-xs text-slate-400">{formatDuration(s.durationMinutes)}</p> : null}
                    </div>
                    <span className="shrink-0 font-semibold text-brand-700">{formatPrice(s.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Gallery thumbnails */}
          {images.length > 1 && (
            <section className="card p-5">
              <h2 className="mb-4 text-lg font-bold text-slate-800">Fotos</h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setGalleryIndex(i)} className="overflow-hidden rounded-xl">
                    <img src={img.imageUrl} alt="" loading="lazy" className={`h-24 w-full object-cover transition ${i === galleryIndex ? 'ring-2 ring-brand-500' : 'hover:opacity-90'}`} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <ReviewsSection
            businessId={businessId}
            reviews={reviews ?? []}
            currentUserId={userId}
            isAuthenticated={isAuthenticated}
            onSubmitted={() => {
              queryClient.invalidateQueries({ queryKey: ['reviews', businessId] });
              queryClient.invalidateQueries({ queryKey: ['business', businessId] });
            }}
          />
        </div>

        {/* Sidebar: booking + contact + hours */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-bold text-slate-800">Agende seu horário</h2>
            <p className="text-sm text-slate-500">Escolha o serviço, o profissional e o melhor horário.</p>
            <button onClick={() => setShowBooking(true)} className="btn-primary w-full">
              <CalendarPlus className="h-4 w-4" /> Agendar horário
            </button>
          </section>

          <section className="card space-y-2 p-5">
            <h2 className="mb-2 text-lg font-bold text-slate-800">Contato</h2>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn w-full bg-emerald-500 text-white hover:bg-emerald-600">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="btn-secondary w-full">
                <Phone className="h-4 w-4" /> {business.phone}
              </a>
            )}
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-secondary w-full">
              <Navigation className="h-4 w-4" /> Como chegar
            </a>
            {(business.address || business.city) && (
              <p className="flex items-start gap-2 pt-2 text-sm text-slate-500">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {[business.address, business.addressNumber].filter(Boolean).join(', ')}
                  {business.neighborhood ? ` - ${business.neighborhood}` : ''}
                  <br />
                  {[business.city, business.state].filter(Boolean).join(' - ')}
                </span>
              </p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
              <Clock className="h-5 w-5" /> Horários
            </h2>
            <ul className="space-y-1.5 text-sm">
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const h = business.hours.find((x) => x.dayOfWeek === day);
                return (
                  <li key={day} className="flex items-center justify-between">
                    <span className="text-slate-600">{DAY_LABELS[day]}</span>
                    <span className={h?.open ? 'font-medium text-slate-800' : 'text-slate-400'}>
                      {h?.open && h.openingTime && h.closingTime ? `${h.openingTime} - ${h.closingTime}` : 'Fechado'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>

      {showBooking && (
        <BookingModal
          business={business}
          onClose={() => setShowBooking(false)}
          onBooked={() => {
            setShowBooking(false);
            navigate('/bookings');
          }}
        />
      )}
    </div>
  );
}

function ReviewsSection({
  businessId,
  reviews,
  currentUserId,
  isAuthenticated,
  onSubmitted,
}: {
  businessId: number;
  reviews: import('@/types').Review[];
  currentUserId: string | null;
  isAuthenticated: boolean;
  onSubmitted: () => void;
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const existing = reviews.find((r) => r.userId === currentUserId);
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/business/${businessId}` } });
      return;
    }
    setSaving(true);
    try {
      await reviewApi.submit(businessId, rating, comment);
      toast.success('Avaliação enviada!');
      onSubmitted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar avaliação.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card p-5">
      <h2 className="mb-4 text-lg font-bold text-slate-800">Avaliações</h2>

      <div className="mb-5 rounded-2xl bg-slate-50 p-4">
        <p className="mb-2 text-sm font-medium text-slate-700">
          {existing ? 'Edite sua avaliação' : 'Deixe sua avaliação'}
        </p>
        <StarRating value={rating} size={26} onChange={setRating} />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte como foi sua experiência..."
          rows={3}
          className="input mt-3 resize-none"
        />
        <button onClick={submit} disabled={saving} className="btn-primary mt-3">
          {existing ? 'Atualizar avaliação' : 'Enviar avaliação'}
        </button>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-400">Seja o primeiro a avaliar este negócio.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-slate-100 pb-4 last:border-0">
              <div className="flex items-center justify-between">
                <StarRating value={r.rating} size={14} />
                <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              {r.comment && <p className="mt-1.5 text-sm text-slate-600">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
