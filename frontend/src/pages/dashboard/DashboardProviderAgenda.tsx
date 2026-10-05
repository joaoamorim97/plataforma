import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, UserCog, Trash2 } from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { appointmentApi, providerApi } from '@/lib/services';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, EmptyState } from '@/components/ui/Feedback';
import { NoBusiness } from './NoBusiness';
import { formatPrice } from '@/lib/format';
import type { Appointment, Provider } from '@/types';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function DashboardProviderAgenda() {
  const { business, isLoading } = useMyBusiness();
  const toast = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const businessId = business?.id;

  useEffect(() => {
    if (!businessId) return;
    providerApi.list(businessId).then((p) => {
      setProviders(p);
      setSelected(p[0]?.id ?? null);
    });
  }, [businessId]);

  const load = useCallback(async () => {
    if (!businessId || !selected) {
      setAppointments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setAppointments(await appointmentApi.list(businessId, { providerId: selected }));
    } finally {
      setLoading(false);
    }
  }, [businessId, selected]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) return <FullSpinner />;
  if (!business) return <NoBusiness />;

  const remove = async (a: Appointment) => {
    if (!confirm(`Cancelar o agendamento de ${a.clientName}?`)) return;
    await appointmentApi.remove(business.id, a.id);
    toast.success('Agendamento cancelado.');
    load();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <CalendarClock className="h-6 w-6" /> Agenda por profissional
        </h1>
        <p className="text-sm text-slate-500">Todos os compromissos de cada profissional</p>
      </div>

      {providers.length === 0 ? (
        <EmptyState icon={UserCog} title="Nenhum profissional" description="Cadastre profissionais em Equipe e Recursos." />
      ) : (
        <>
          <div className="card flex flex-wrap items-center gap-3 p-4">
            <label className="text-sm font-semibold text-slate-700">Profissional:</label>
            <select
              value={selected ?? ''}
              onChange={(e) => setSelected(Number(e.target.value))}
              className="input w-auto flex-1 py-2 sm:max-w-xs"
            >
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}{p.role ? ` · ${p.role}` : ''}</option>)}
            </select>
          </div>

          {loading ? (
            <FullSpinner />
          ) : appointments.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Agenda livre" description="Nenhum agendamento para este profissional." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="p-4">Data</th>
                    <th className="p-4">Horário</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Serviço</th>
                    <th className="p-4">Valor</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-4 font-semibold text-slate-700">{formatDate(a.date)}</td>
                      <td className="p-4 font-bold text-brand-600">{a.time}</td>
                      <td className="p-4 text-slate-800">{a.clientName}</td>
                      <td className="p-4">
                        <span className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium">
                          {a.serviceName || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{a.servicePrice !== null ? formatPrice(a.servicePrice) : '--'}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => remove(a)} className="rounded bg-rose-50 px-3 py-1 text-rose-500 transition hover:text-rose-700">
                          <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Cancelar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
