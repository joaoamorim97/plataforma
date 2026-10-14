import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingBag, X, MapPin } from 'lucide-react';
import { orderApi } from '@/lib/services';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, EmptyState } from '@/components/ui/Feedback';
import { formatPrice } from '@/lib/format';
import { useI18n } from '@/i18n/I18nContext';
import { ORDER_STATUS_LABELS, type Order } from '@/types';

const STATUS_CLS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-sky-50 text-sky-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-rose-50 text-rose-600',
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function MyOrdersPage() {
  const toast = useToast();
  const { t } = useI18n();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderApi.myOrders(),
  });

  const cancel = async (o: Order) => {
    if (!confirm(`${t('orders.cancel')}?`)) return;
    try {
      await orderApi.cancel(o.id);
      toast.success(t('orders.cancelled'));
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
          <ShoppingBag className="h-6 w-6" /> {t('orders.title')}
        </h1>
      </div>

      {isLoading ? (
        <FullSpinner />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={t('orders.title')}
          description={t('orders.empty')}
          action={<Link to="/" className="btn-primary">{t('bookings.explore')}</Link>}
        />
      ) : (
        <div className="space-y-3">
          {data.map((o) => {
            const statusCls = STATUS_CLS[o.status] ?? STATUS_CLS.PENDING;
            const canCancel = o.status === 'PENDING' || o.status === 'CONFIRMED';
            return (
              <div key={o.id} className={`card p-4 ${o.status === 'CANCELLED' ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/business/${o.businessId}`} className="font-semibold text-slate-800 hover:text-brand-600">
                      {o.businessName ?? 'Negócio'}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {t('orders.at')} {formatDateTime(o.createdAt)}
                    </p>
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

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">{formatPrice(o.total)}</span>
                  <div className="flex gap-2">
                    <Link to={`/business/${o.businessId}`} className="btn-ghost text-sm">
                      <MapPin className="h-4 w-4" /> {t('action.viewBusiness')}
                    </Link>
                    {canCancel && (
                      <button onClick={() => cancel(o)} className="btn-ghost text-sm text-rose-600">
                        <X className="h-4 w-4" /> {t('orders.cancel')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
