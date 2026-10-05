import { useState } from 'react';
import { Plus, Trash2, Pencil, Scissors, X } from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { businessApi } from '@/lib/services';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, EmptyState, Spinner } from '@/components/ui/Feedback';
import { NoBusiness } from './NoBusiness';
import { formatDuration, formatPrice } from '@/lib/format';
import type { ServiceItem } from '@/types';

export function DashboardServices() {
  const { business, isLoading, refetch } = useMyBusiness();
  const toast = useToast();
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) return <FullSpinner />;
  if (!business) return <NoBusiness />;

  const openNew = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (s: ServiceItem) => {
    setEditing(s);
    setShowForm(true);
  };

  const remove = async (s: ServiceItem) => {
    if (!confirm(`Excluir o serviço "${s.name}"?`)) return;
    try {
      await businessApi.removeService(business.id, s.id);
      toast.success('Serviço excluído.');
      refetch();
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Serviços</h1>
          <p className="text-sm text-slate-500">Gerencie os serviços oferecidos</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      {business.services.length === 0 ? (
        <EmptyState icon={Scissors} title="Nenhum serviço" description="Adicione os serviços que você oferece com preço e duração." />
      ) : (
        <div className="space-y-3">
          {business.services.map((s) => (
            <div key={s.id} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-slate-800">{s.name}</p>
                {s.description && <p className="text-sm text-slate-500">{s.description}</p>}
                <p className="mt-0.5 text-sm text-slate-500">
                  <span className="font-semibold text-brand-700">{formatPrice(s.price)}</span>
                  {s.durationMinutes ? ` · ${formatDuration(s.durationMinutes)}` : ''}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(s)} className="btn-ghost p-2" aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => remove(s)} className="btn-ghost p-2 text-red-500" aria-label="Excluir">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ServiceForm
          businessId={business.id}
          service={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function ServiceForm({
  businessId,
  service,
  onClose,
  onSaved,
}: {
  businessId: number;
  service: ServiceItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(service?.name ?? '');
  const [description, setDescription] = useState(service?.description ?? '');
  const [price, setPrice] = useState(service?.price?.toString() ?? '');
  const [duration, setDuration] = useState(service?.durationMinutes?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name,
      description: description || null,
      price: price ? Number(price) : null,
      durationMinutes: duration ? Number(duration) : null,
    };
    try {
      if (service) await businessApi.updateService(businessId, service.id, payload);
      else await businessApi.addService(businessId, payload);
      toast.success('Serviço salvo!');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6 sm:rounded-2xl animate-fade-in"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{service ? 'Editar serviço' : 'Novo serviço'}</h2>
          <button type="button" onClick={onClose} className="btn-ghost p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Descrição</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Preço (R$)</label>
            <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="input" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Duração (min)</label>
            <input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} className="input" />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving && <Spinner className="h-4 w-4" />}
          Salvar
        </button>
      </form>
    </div>
  );
}
