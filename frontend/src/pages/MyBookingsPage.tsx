import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarX, MapPin, MessageCircle, Clock } from 'lucide-react';
import { bookingApi } from '@/lib/services';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, EmptyState } from '@/components/ui/Feedback';
import { formatPrice } from '@/lib/format';
import { useI18n } from '@/i18n/I18nContext';
import type { MyBooking } from '@/types';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const STATUS_CLS: Record<string, string> = {
  BOOKED: 'bg-emerald-50 text-emerald-700',
  DONE: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-rose-50 text-rose-600',
};

const STATUS_KEY: Record<string, string> = {
  BOOKED: 'bookings.statusBooked',
  DONE: 'bookings.statusDone',
  CANCELLED: 'bookings.statusCancelled',
};

export function MyBookingsPage() {
  const toast = useToast();
  const { t } = useI18n();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingApi.myBookings(),
  });

  const cancel = async (b: MyBooking) => {
    if (!confirm(`Cancelar o agendamento em ${b.businessName}?`)) return;
    try {
      await bookingApi.cancel(b.id);
      toast.success(t('bookings.statusCancelled'));
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar.');
    }
  };

  const active = (data ?? []).filter((b) => b.status !== 'CANCELLED');
  const cancelled = (data ?? []).filter((b) => b.status === 'CANCELLED');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{t('bookings.title')}</h1>
        <p className="text-sm text-slate-500">{t('bookings.subtitle')}</p>
      </div>

      {isLoading ? (
        <FullSpinner />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title={t('bookings.emptyTitle')}
          description={t('bookings.emptyDesc')}
          action={
            <Link to="/" className="btn-primary">
              {t('bookings.explore')}
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {active.map((b) => (
            <BookingCard key={b.id} booking={b} onCancel={() => cancel(b)} />
          ))}
          {cancelled.length > 0 && (
            <>
              <h2 className="pt-4 text-sm font-semibold text-slate-400">{t('bookings.cancelled')}</h2>
              {cancelled.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking, onCancel }: { booking: MyBooking; onCancel?: () => void }) {
  const { t } = useI18n();
  const statusCls = STATUS_CLS[booking.status] ?? STATUS_CLS.BOOKED;
  const statusLabel = t(STATUS_KEY[booking.status] ?? 'bookings.statusBooked');
  const whatsapp = booking.businessWhatsapp
    ? `https://wa.me/${booking.businessWhatsapp.replace(/\D/g, '')}`
    : null;

  return (
    <div className={`card p-4 ${booking.status === 'CANCELLED' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/business/${booking.businessId}`} className="font-semibold text-slate-800 hover:text-brand-600">
            {booking.businessName ?? 'Negócio'}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> {formatDate(booking.date)} às {booking.time}
            </span>
            {booking.serviceName && <span>· {booking.serviceName}</span>}
            {booking.servicePrice != null && <span className="font-medium text-slate-700">{formatPrice(booking.servicePrice)}</span>}
          </div>
          {booking.providerName && (
            <p className="mt-1 text-xs text-slate-400">{t('bookings.with')} {booking.providerName}</p>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusCls}`}>
          {statusLabel}
        </span>
      </div>

      {booking.status !== 'CANCELLED' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
          <Link to={`/business/${booking.businessId}`} className="btn-ghost text-sm">
            <MapPin className="h-4 w-4" /> {t('action.viewBusiness')}
          </Link>
          {onCancel && (
            <button onClick={onCancel} className="btn-ghost text-sm text-rose-600">
              <CalendarX className="h-4 w-4" /> {t('action.cancel')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
