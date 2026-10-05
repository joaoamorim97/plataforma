import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Users, Armchair, X } from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { providerApi, resourceApi } from '@/lib/services';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, EmptyState, Spinner } from '@/components/ui/Feedback';
import { NoBusiness } from './NoBusiness';
import type { Provider, Resource } from '@/types';

export function DashboardTeam() {
  const { business, isLoading } = useMyBusiness();
  const toast = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [provModal, setProvModal] = useState<Provider | null | 'new'>(null);
  const [resModal, setResModal] = useState<Resource | null | 'new'>(null);

  const businessId = business?.id;

  const load = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [p, r] = await Promise.all([providerApi.list(businessId), resourceApi.list(businessId)]);
      setProviders(p);
      setResources(r);
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

  const removeProvider = async (p: Provider) => {
    if (!confirm(`Excluir ${p.name}?`)) return;
    await providerApi.remove(business.id, p.id);
    toast.success('Profissional excluído.');
    load();
  };
  const removeResource = async (r: Resource) => {
    if (!confirm(`Excluir ${r.name}?`)) return;
    await resourceApi.remove(business.id, r.id);
    toast.success('Recurso excluído.');
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Equipe e Recursos</h1>
        <p className="text-sm text-slate-500">Profissionais e recursos usados nos agendamentos</p>
      </div>

      {loading ? (
        <FullSpinner />
      ) : (
        <>
          {/* Providers */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Users className="h-5 w-5" /> Profissionais
              </h2>
              <button onClick={() => setProvModal('new')} className="btn-primary">
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </div>
            {providers.length === 0 ? (
              <EmptyState icon={Users} title="Nenhum profissional" description="Adicione profissionais para vincular aos agendamentos." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {providers.map((p) => (
                  <div key={p.id} className="card flex items-center gap-3 p-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">{p.name}</p>
                      <p className="truncate text-xs text-slate-500">{p.role || 'Profissional'}</p>
                    </div>
                    <button onClick={() => setProvModal(p)} className="btn-ghost p-2"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => removeProvider(p)} className="btn-ghost p-2 text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Resources */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Armchair className="h-5 w-5" /> Recursos
              </h2>
              <button onClick={() => setResModal('new')} className="btn-primary">
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </div>
            {resources.length === 0 ? (
              <EmptyState icon={Armchair} title="Nenhum recurso" description="Cadeiras, salas ou estações usadas nos agendamentos." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {resources.map((r) => (
                  <div key={r.id} className="card flex items-center gap-3 p-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Armchair className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">{r.name}</p>
                      <p className="truncate text-xs text-slate-500">{r.kind || 'Recurso'}</p>
                    </div>
                    <button onClick={() => setResModal(r)} className="btn-ghost p-2"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => removeResource(r)} className="btn-ghost p-2 text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {provModal !== null && (
        <ProviderModal
          businessId={business.id}
          provider={provModal === 'new' ? null : provModal}
          onClose={() => setProvModal(null)}
          onSaved={() => {
            setProvModal(null);
            load();
          }}
        />
      )}
      {resModal !== null && (
        <ResourceModal
          businessId={business.id}
          resource={resModal === 'new' ? null : resModal}
          onClose={() => setResModal(null)}
          onSaved={() => {
            setResModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6 sm:rounded-2xl animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProviderModal({ businessId, provider, onClose, onSaved }: { businessId: number; provider: Provider | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(provider?.name ?? '');
  const [role, setRole] = useState(provider?.role ?? '');
  const [phone, setPhone] = useState(provider?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, role, phone };
      if (provider) await providerApi.update(businessId, provider.id, payload);
      else await providerApi.create(businessId, payload);
      toast.success('Profissional salvo!');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={provider ? 'Editar profissional' : 'Novo profissional'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Função / Especialidade</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} className="input" placeholder="Ex: Barbeiro" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Telefone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving && <Spinner className="h-4 w-4" />} Salvar
        </button>
      </form>
    </ModalShell>
  );
}

function ResourceModal({ businessId, resource, onClose, onSaved }: { businessId: number; resource: Resource | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(resource?.name ?? '');
  const [kind, setKind] = useState(resource?.kind ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name, kind };
      if (resource) await resourceApi.update(businessId, resource.id, payload);
      else await resourceApi.create(businessId, payload);
      toast.success('Recurso salvo!');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={resource ? 'Editar recurso' : 'Novo recurso'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</label>
          <input value={kind} onChange={(e) => setKind(e.target.value)} className="input" placeholder="Ex: Cadeira, Sala" />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving && <Spinner className="h-4 w-4" />} Salvar
        </button>
      </form>
    </ModalShell>
  );
}
