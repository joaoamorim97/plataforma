import { useEffect, useState } from 'react';
import { Save, Clock } from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { businessApi } from '@/lib/services';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, Spinner } from '@/components/ui/Feedback';
import { NoBusiness } from './NoBusiness';
import { DAY_LABELS } from '@/types';

interface DayState {
  dayOfWeek: number;
  open: boolean;
  openingTime: string;
  closingTime: string;
}

// Display order: Monday..Saturday, then Sunday
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function DashboardHours() {
  const { business, isLoading, refetch } = useMyBusiness();
  const toast = useToast();
  const [days, setDays] = useState<DayState[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!business) return;
    const map = new Map(business.hours.map((h) => [h.dayOfWeek, h]));
    setDays(
      ORDER.map((d) => {
        const h = map.get(d);
        return {
          dayOfWeek: d,
          open: h?.open ?? (d !== 0),
          openingTime: h?.openingTime ?? '09:00',
          closingTime: h?.closingTime ?? '19:00',
        };
      }),
    );
  }, [business]);

  if (isLoading) return <FullSpinner />;
  if (!business) return <NoBusiness />;

  const update = (dow: number, patch: Partial<DayState>) =>
    setDays((prev) => prev.map((d) => (d.dayOfWeek === dow ? { ...d, ...patch } : d)));

  const save = async () => {
    setSaving(true);
    try {
      await businessApi.replaceHours(
        business.id,
        days.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          open: d.open,
          openingTime: d.open ? d.openingTime : null,
          closingTime: d.open ? d.closingTime : null,
        })),
      );
      toast.success('Horários salvos!');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Clock className="h-6 w-6" /> Horários
          </h1>
          <p className="text-sm text-slate-500">Defina quando seu negócio está aberto</p>
        </div>
      </div>

      <div className="card divide-y divide-slate-100">
        {days.map((d) => (
          <div key={d.dayOfWeek} className="flex flex-wrap items-center gap-4 p-4">
            <span className="w-24 font-semibold text-slate-700">{DAY_LABELS[d.dayOfWeek]}</span>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={d.open}
                onChange={(e) => update(d.dayOfWeek, { open: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-600">{d.open ? 'Aberto' : 'Fechado'}</span>
            </label>
            {d.open && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={d.openingTime}
                  onChange={(e) => update(d.dayOfWeek, { openingTime: e.target.value })}
                  className="input w-32 py-2"
                />
                <span className="text-slate-400">até</span>
                <input
                  type="time"
                  value={d.closingTime}
                  onChange={(e) => update(d.dayOfWeek, { closingTime: e.target.value })}
                  className="input w-32 py-2"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          Salvar horários
        </button>
      </div>
    </div>
  );
}
