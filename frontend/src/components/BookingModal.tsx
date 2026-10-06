import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CalendarPlus, Check } from 'lucide-react';
import { bookingApi } from '@/lib/services';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Feedback';
import { formatPrice } from '@/lib/format';
import { useI18n } from '@/i18n/I18nContext';
import type { BusinessDetail, Provider, Slot } from '@/types';

function todayStr(): string {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().split('T')[0];
}

interface Props {
  business: BusinessDetail;
  onClose: () => void;
  onBooked: () => void;
}

export function BookingModal({ business, onClose, onBooked }: Props) {
  const { isAuthenticated, profile } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [date, setDate] = useState(todayStr());
  const [providerId, setProviderId] = useState<number | undefined>(undefined);
  const [serviceId, setServiceId] = useState<number | undefined>(business.services[0]?.id);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [time, setTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState(profile?.name ?? '');
  const [clientPhone, setClientPhone] = useState(profile?.phone ?? '');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carrega profissionais ativos do negócio
  useEffect(() => {
    bookingApi.publicProviders(business.id).then(setProviders).catch(() => setProviders([]));
  }, [business.id]);

  // Carrega disponibilidade sempre que data/profissional mudam
  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    setTime(null);
    bookingApi
      .availability(business.id, date, providerId)
      .then((s) => active && setSlots(s))
      .catch(() => active && setSlots([]))
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [business.id, date, providerId]);

  const selectedService = useMemo(
    () => business.services.find((s) => s.id === serviceId),
    [business.services, serviceId],
  );

  const submit = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/business/${business.id}` } });
      return;
    }
    if (!time) {
      toast.info(t('book.chooseSlot'));
      return;
    }
    setSaving(true);
    try {
      await bookingApi.book(business.id, {
        date,
        time,
        serviceId: serviceId ?? null,
        providerId: providerId ?? null,
        clientName: clientName || null,
        clientPhone: clientPhone || null,
      });
      toast.success(t('book.success'));
      onBooked();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível agendar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-2xl animate-fade-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <CalendarPlus className="h-5 w-5 text-brand-600" /> {t('book.title')}
          </h2>
          <button onClick={onClose} className="btn-ghost p-2"><X className="h-5 w-5" /></button>
        </div>

        <p className="mb-4 text-sm text-slate-500">
          {t('book.at')} <span className="font-semibold text-slate-700">{business.name}</span>
        </p>

        {business.services.length > 0 && (
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('common.service')}</label>
            <select value={serviceId ?? ''} onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : undefined)} className="input">
              {business.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.price != null ? ` — ${formatPrice(s.price)}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {providers.length > 0 && (
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('common.professional')} {t('common.optional')}</label>
            <select value={providerId ?? ''} onChange={(e) => setProviderId(e.target.value ? Number(e.target.value) : undefined)} className="input">
              <option value="">{t('book.noPreference')}</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.role ? ` · ${p.role}` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('common.date')}</label>
          <input type="date" value={date} min={todayStr()} onChange={(e) => setDate(e.target.value)} className="input py-2" />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('common.time')}</label>
          {loadingSlots ? (
            <div className="flex justify-center py-6"><Spinner className="h-6 w-6 text-brand-500" /></div>
          ) : slots.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">{t('book.noSlots')}</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setTime(s.time)}
                  className={`rounded-xl py-2 text-sm font-semibold transition ${
                    time === s.time
                      ? 'bg-brand-600 text-white'
                      : s.available
                        ? 'bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-600'
                        : 'cursor-not-allowed bg-slate-50 text-slate-300 line-through'
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('book.yourName')}</label>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} className="input" placeholder={t('book.yourName')} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('common.phone')}</label>
            <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="input" placeholder="(11) 9...." />
          </div>
        </div>

        {selectedService && (
          <div className="mb-4 flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm">
            <span className="text-slate-600">{selectedService.name}</span>
            {selectedService.price != null && <span className="font-bold text-brand-700">{formatPrice(selectedService.price)}</span>}
          </div>
        )}

        <button onClick={submit} disabled={saving || !time} className="btn-primary w-full">
          {saving ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {isAuthenticated ? t('book.confirm') : t('book.loginToBook')}
        </button>
      </div>
    </div>
  );
}
