import { useCallback, useEffect, useState } from 'react';
import { Plus, X, CalendarDays, Trash2 } from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { appointmentApi, providerApi, resourceApi } from '@/lib/services';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, EmptyState, Spinner } from '@/components/ui/Feedback';
import { NoBusiness } from './NoBusiness';
import { useI18n } from '@/i18n/I18nContext';
import { TIMESLOTS, type Appointment, type Provider, type Resource } from '@/types';

function today(): string {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().split('T')[0];
}

export function DashboardAgenda() {
  const { business, isLoading } = useMyBusiness();
  const toast = useToast();
  const { t } = useI18n();
  const [date, setDate] = useState(today());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ resourceId?: number; time?: string } | null>(null);

  const businessId = business?.id;

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [a, r, p] = await Promise.all([
        appointmentApi.list(businessId, { date }),
        resourceApi.list(businessId),
        providerApi.list(businessId),
      ]);
      setAppointments(a);
      setResources(r);
      setProviders(p);
    } finally {
      setLoading(false);
    }
  }, [businessId, date]);

  useEffect(() => {
    if (businessId) load();
  }, [businessId, load]);

  if (isLoading) return <FullSpinner />;
  if (!business) return <NoBusiness />;

  const remove = async (a: Appointment) => {
    if (!confirm(`Cancelar o agendamento de ${a.clientName}?`)) return;
    await appointmentApi.remove(business.id, a.id);
    toast.success('Agendamento cancelado.');
    load();
  };

  const apptAt = (resourceId: number, time: string) =>
    appointments.find((a) => a.resourceId === resourceId && a.time === time && a.status !== 'CANCELLED');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <CalendarDays className="h-6 w-6" /> {t('agenda.title')}
          </h1>
          <p className="text-sm text-slate-500">{t('agenda.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-auto py-2" />
          <button onClick={() => setModal({})} className="btn-primary">
            <Plus className="h-4 w-4" /> {t('agenda.book')}
          </button>
        </div>
      </div>

      {loading ? (
        <FullSpinner />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t('agenda.needResources')}
          description={t('agenda.needResourcesDesc')}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <div className="flex min-w-max">
            {/* Time column */}
            <div className="sticky left-0 z-10 w-16 shrink-0 border-r border-slate-100 bg-slate-50">
              <div className="h-14 border-b border-slate-100" />
              {TIMESLOTS.map((t) => (
                <div key={t} className="flex h-16 items-center justify-center text-xs font-semibold text-slate-400">
                  {t}
                </div>
              ))}
            </div>

            {/* Resource columns */}
            {resources.map((res) => (
              <div key={res.id} className="w-48 shrink-0 border-r border-slate-100 last:border-r-0">
                <div className="flex h-14 flex-col items-center justify-center border-b border-slate-100 bg-slate-50 px-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{res.kind || 'Recurso'}</span>
                  <span className="truncate text-sm font-semibold text-slate-700">{res.name}</span>
                </div>
                {TIMESLOTS.map((time) => {
                  const appt = apptAt(res.id, time);
                  if (appt) {
                    return (
                      <div key={time} className="h-16 border-b border-slate-100 p-1">
                        <div className="group relative flex h-full flex-col justify-center rounded-lg bg-brand-600 px-2 py-1 text-white">
                          <span className="truncate text-sm font-bold">{appt.clientName}</span>
                          <span className="truncate text-[11px] opacity-90">{appt.serviceName || ''}</span>
                          {appt.providerName && (
                            <span className="truncate text-[10px] font-semibold uppercase opacity-80">{appt.providerName}</span>
                          )}
                          <button
                            onClick={() => remove(appt)}
                            className="absolute right-1 top-1 hidden rounded bg-white/20 p-1 group-hover:block"
                            aria-label="Cancelar"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={time}
                      onClick={() => setModal({ resourceId: res.id, time })}
                      className="flex h-16 w-full items-center justify-center border-b border-slate-100 text-xs text-slate-300 transition hover:bg-brand-50 hover:text-brand-500"
                    >
                      +
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {modal !== null && (
        <BookingModal
          businessId={business.id}
          date={date}
          providers={providers}
          resources={resources}
          services={business.services}
          preset={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function BookingModal({
  businessId,
  date,
  providers,
  resources,
  services,
  preset,
  onClose,
  onSaved,
}: {
  businessId: number;
  date: string;
  providers: Provider[];
  resources: Resource[];
  services: import('@/types').ServiceItem[];
  preset: { resourceId?: number; time?: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    date,
    time: preset.time ?? TIMESLOTS[0],
    clientName: '',
    clientPhone: '',
    resourceId: preset.resourceId ?? resources[0]?.id ?? undefined,
    providerId: providers[0]?.id ?? undefined,
    serviceId: services[0]?.id ?? undefined,
  });
  const [saving, setSaving] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await appointmentApi.create(businessId, {
        date: form.date,
        time: form.time,
        clientName: form.clientName,
        clientPhone: form.clientPhone || null,
        resourceId: form.resourceId ?? null,
        providerId: form.providerId ?? null,
        serviceId: form.serviceId ?? null,
      });
      toast.success('Agendamento criado!');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao agendar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6 sm:rounded-2xl animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Novo agendamento</h2>
          <button type="button" onClick={onClose} className="btn-ghost p-2"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Data</label>
            <input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} className="input py-2" required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Horário</label>
            <select value={form.time} onChange={(e) => set({ time: e.target.value })} className="input py-2">
              {TIMESLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Cliente</label>
          <input value={form.clientName} onChange={(e) => set({ clientName: e.target.value })} className="input" placeholder="Nome do cliente" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Telefone (opcional)</label>
          <input value={form.clientPhone} onChange={(e) => set({ clientPhone: e.target.value })} className="input" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Recurso</label>
          <select value={form.resourceId} onChange={(e) => set({ resourceId: Number(e.target.value) })} className="input" required>
            {resources.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Profissional</label>
          <select value={form.providerId ?? ''} onChange={(e) => set({ providerId: e.target.value ? Number(e.target.value) : undefined })} className="input">
            <option value="">—</option>
            {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Serviço</label>
          <select value={form.serviceId ?? ''} onChange={(e) => set({ serviceId: e.target.value ? Number(e.target.value) : undefined })} className="input">
            <option value="">—</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving && <Spinner className="h-4 w-4" />} Confirmar agendamento
        </button>
      </form>
    </div>
  );
}
