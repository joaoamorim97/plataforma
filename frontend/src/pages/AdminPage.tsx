import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ShieldCheck, Plus, Store, UserPlus, X, Eye, Mail } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { adminApi, type BusinessPayload } from '@/lib/services';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, EmptyState, Spinner } from '@/components/ui/Feedback';
import type { BusinessDetail, BusinessCategory } from '@/types';

export function AdminPage() {
  const { profile, loading } = useAuth();
  const toast = useToast();
  const [businesses, setBusinesses] = useState<BusinessDetail[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [assigning, setAssigning] = useState<BusinessDetail | null>(null);

  const load = async () => {
    setLoadingList(true);
    try {
      setBusinesses(await adminApi.listAll());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'ADMIN') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.role]);

  if (loading) return <FullSpinner />;
  if (profile && profile.role !== 'ADMIN') return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
            <ShieldCheck className="h-6 w-6 text-brand-600" /> Painel do administrador
          </h1>
          <p className="text-sm text-slate-500">Cadastre negócios e atribua donos por e-mail.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Novo negócio
        </button>
      </div>

      {loadingList ? (
        <FullSpinner />
      ) : businesses.length === 0 ? (
        <EmptyState icon={Store} title="Nenhum negócio" description="Crie o primeiro negócio da plataforma." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-4">Negócio</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Dono</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-4 font-semibold text-slate-800">{b.name}</td>
                  <td className="p-4 text-slate-600">{b.category === 'BARBER' ? 'Barbearia' : 'Cabeleireiro'}</td>
                  <td className="p-4">
                    {b.ownerId ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {b.ownerEmail || 'Vinculado'}
                      </span>
                    ) : b.ownerEmail ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        <Mail className="h-3 w-3" /> {b.ownerEmail} (pendente)
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">Sem dono</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${b.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {b.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setAssigning(b)} className="btn-ghost p-2" title="Atribuir dono">
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <Link to={`/business/${b.id}`} className="btn-ghost p-2" title="Ver página pública">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <BusinessFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
      {assigning && (
        <AssignOwnerModal
          business={assigning}
          onClose={() => setAssigning(null)}
          onSaved={() => { setAssigning(null); load(); }}
        />
      )}
    </div>
  );
}

function BusinessFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BusinessPayload>({
    name: '',
    category: 'HAIRDRESSER',
    whatsapp: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    ownerEmail: '',
  });

  const set = (patch: Partial<BusinessPayload>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Informe o nome.');
    setSaving(true);
    try {
      await adminApi.create(form);
      toast.success('Negócio criado!');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Novo negócio" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome do negócio">
          <input value={form.name} onChange={(e) => set({ name: e.target.value })} className="input" required />
        </Field>
        <Field label="Categoria">
          <select value={form.category} onChange={(e) => set({ category: e.target.value as BusinessCategory })} className="input">
            <option value="HAIRDRESSER">💇 Cabeleireiro</option>
            <option value="BARBER">💈 Barbearia</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="WhatsApp">
            <input value={form.whatsapp ?? ''} onChange={(e) => set({ whatsapp: e.target.value })} className="input" placeholder="5511999999999" />
          </Field>
          <Field label="Telefone">
            <input value={form.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} className="input" />
          </Field>
        </div>
        <Field label="Endereço">
          <input value={form.address ?? ''} onChange={(e) => set({ address: e.target.value })} className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cidade">
            <input value={form.city ?? ''} onChange={(e) => set({ city: e.target.value })} className="input" />
          </Field>
          <Field label="Estado">
            <input value={form.state ?? ''} onChange={(e) => set({ state: e.target.value })} className="input" />
          </Field>
        </div>
        <Field label="E-mail do dono (opcional)">
          <input type="email" value={form.ownerEmail ?? ''} onChange={(e) => set({ ownerEmail: e.target.value })} className="input" placeholder="dono@email.com" />
          <p className="mt-1 text-xs text-slate-400">O negócio é vinculado quando essa conta fizer login.</p>
        </Field>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving && <Spinner className="h-4 w-4" />} Criar negócio
        </button>
      </form>
    </ModalShell>
  );
}

function AssignOwnerModal({ business, onClose, onSaved }: { business: BusinessDetail; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [email, setEmail] = useState(business.ownerEmail ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Informe o e-mail do dono.');
    setSaving(true);
    try {
      await adminApi.assignOwner(business.id, email.trim());
      toast.success('Dono atribuído! Será vinculado quando a conta fizer login.');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atribuir.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Atribuir dono — ${business.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-mail do dono">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="dono@email.com" required />
        </Field>
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-800">
          Quando a pessoa criar/entrar na conta com este e-mail, o negócio aparecerá
          automaticamente no painel dela.
        </p>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving && <Spinner className="h-4 w-4" />} Atribuir dono
        </button>
      </form>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-2xl animate-fade-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
