import { useEffect, useState } from 'react';
import { Plus, Trash2, Boxes, X } from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { inventoryApi } from '@/lib/services';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, EmptyState, Spinner } from '@/components/ui/Feedback';
import { NoBusiness } from './NoBusiness';
import { formatPrice } from '@/lib/format';
import { useI18n } from '@/i18n/I18nContext';
import { type InventoryItem, type InventoryKind } from '@/types';

export function DashboardInventory() {
  const { business, isLoading } = useMyBusiness();
  const toast = useToast();
  const { t } = useI18n();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const businessId = business?.id;

  const load = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      setItems(await inventoryApi.list(businessId));
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

  const adjust = async (item: InventoryItem, delta: number) => {
    const updated = await inventoryApi.adjust(business.id, item.id, delta);
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  };

  const remove = async (item: InventoryItem) => {
    if (!confirm(`${t('action.delete')} ${item.name}?`)) return;
    await inventoryApi.remove(business.id, item.id);
    toast.success(t('action.delete'));
    load();
  };

  const lowCount = items.filter((i) => i.lowStock).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <Boxes className="h-6 w-6" /> {t('inv.title')}
          </h1>
          <p className="text-sm text-slate-500">{t('inv.subtitle')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> {t('inv.addItem')}
        </button>
      </div>

      {lowCount > 0 && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {lowCount} {lowCount === 1 ? t('dash.lowStockItem') : t('dash.lowStockItems2')} {t('inv.low')}.
        </div>
      )}

      {loading ? (
        <FullSpinner />
      ) : items.length === 0 ? (
        <EmptyState icon={Boxes} title={t('inv.emptyTitle')} description={t('inv.emptyDesc')} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-4">{t('inv.product')}</th>
                <th className="p-4">{t('inv.classification')}</th>
                <th className="p-4">{t('inv.unitPrice')}</th>
                <th className="p-4 text-center">{t('inv.inStock')}</th>
                <th className="p-4 text-center">{t('action.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="p-4 font-semibold text-slate-800">{i.name}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${i.kind === 'SUPPLY' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {i.kind === 'SUPPLY' ? t('inv.supply') : t('inv.resale')}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{i.unitPrice !== null ? formatPrice(i.unitPrice) : '--'}</td>
                  <td className="p-4 text-center">
                    <span className={`text-lg font-black ${i.lowStock ? 'text-rose-500' : 'text-slate-800'}`}>{i.quantity}</span>
                    {i.lowStock && <span className="ml-2 text-[10px] font-bold uppercase text-rose-500">{t('inv.low')}</span>}
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
                      <button onClick={() => adjust(i, -1)} className="bg-white px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100">−</button>
                      <button onClick={() => adjust(i, 1)} className="border-l border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100">+</button>
                      <button onClick={() => remove(i)} className="border-l border-slate-200 bg-white px-3 py-1.5 text-rose-500 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <InventoryModal businessId={business.id} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </div>
  );
}

function InventoryModal({ businessId, onClose, onSaved }: { businessId: number; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<InventoryKind>('SUPPLY');
  const [quantity, setQuantity] = useState('0');
  const [minQuantity, setMinQuantity] = useState('3');
  const [unitPrice, setUnitPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await inventoryApi.create(businessId, {
        name,
        kind,
        quantity: Number(quantity),
        minQuantity: Number(minQuantity),
        unitPrice: unitPrice ? Number(unitPrice) : null,
      });
      toast.success(t('action.save'));
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6 sm:rounded-2xl animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{t('inv.addItem')}</h2>
          <button type="button" onClick={onClose} className="btn-ghost p-2"><X className="h-5 w-5" /></button>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('inv.product')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" required placeholder="Shampoo..." />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('inv.classification')}</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as InventoryKind)} className="input">
            <option value="SUPPLY">{t('inv.supply')}</option>
            <option value="RESALE">{t('inv.resale')}</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('inv.inStock')}</label>
            <input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('inv.low')}</label>
            <input type="number" min="0" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">{t('inv.unitPrice')}</label>
            <input type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="input" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving && <Spinner className="h-4 w-4" />} {t('action.add')}
        </button>
      </form>
    </div>
  );
}
