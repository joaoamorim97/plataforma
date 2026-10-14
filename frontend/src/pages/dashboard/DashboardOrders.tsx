import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { orderApi } from '@/lib/services';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, EmptyState } from '@/components/ui/Feedback';
import { NoBusiness } from './NoBusiness';
import { formatPrice } from '@/lib/format';
import { useI18n } from '@/i18n/I18nContext';
import { ORDER_STATUS_LABELS, type Order, type OrderStatus } from '@/types';

const STATUS_CLS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-sky-100 text-sky-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-600',
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function DashboardOrders() {
  const { business, isLoading } = useMyBusiness();
  const toast = useToast();
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const businessId = business?.id;

  const load = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      setOrders(await orderApi.listForBusiness(businessId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  if (isLoading) return <FullSpinner />;
  if (!business) return <NoBusiness />;

  const setStatus = async (o: Order, status: OrderStatus) => {
    try {
      const updated = await orderApi.updateStatus(business.id, o.id, status);
      setOrders((prev) => prev.map((x) => (x.id === o.id ? updated : x)));
      toast.success(ORDER_STATUS_LABELS[status]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <ShoppingBag className="h-6 w-6" /> {t('ord.title')}
        </h1>
        <p className="text-sm text-slate-500">{t('ord.subtitle')}</p>
      </div>

      {loading ? (
        <FullSpinner />
      ) : orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title={t('ord.title')} description={t('ord.empty')} />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const statusCls = STATUS_CLS[o.status] ?? STATUS_CLS.PENDING;
            return (
              <div key={o.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">{o.clientName}</p>
                    {o.clientPhone && <p className="text-xs text-slate-500">{o.clientPhone}</p>}
                    <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(o.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusCls}`}>
                    {ORDER_STATUS_LABELS[o.status]}
                  </span>
                </div>

                <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 pt-2 text-sm">
                  {o.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between py-1.5">
                      <span className="text-slate-600">{it.quantity}× {it.productName}</span>
                      <span className="text-slate-700">{formatPrice(it.lineTotal)}</span>
                    </li>
                  ))}
                </ul>

                {o.notes && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{o.notes}</p>}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800">{formatPrice(o.total)}</span>
                  {o.status !== 'CANCELLED' && o.status !== 'DELIVERED' && (
                    <div className="flex flex-wrap gap-2">
                      {o.status === 'PENDING' && (
                        <button onClick={() => setStatus(o, 'CONFIRMED')} className="btn-secondary text-sm">
                          {t('ord.markConfirmed')}
                        </button>
                      )}
                      <button onClick={() => setStatus(o, 'DELIVERED')} className="btn-primary text-sm">
                        {t('ord.markDelivered')}
                      </button>
                      <button onClick={() => setStatus(o, 'CANCELLED')} className="btn-ghost text-sm text-rose-600">
                        {t('ord.markCancelled')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
