import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigation, Save, MapPin } from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { businessApi, type BusinessPayload } from '@/lib/services';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, Spinner } from '@/components/ui/Feedback';
import { LocationPicker } from '@/components/LocationPicker';
import type { BusinessCategory } from '@/types';

const empty: BusinessPayload = {
  name: '',
  category: 'HAIRDRESSER',
  description: '',
  phone: '',
  whatsapp: '',
  address: '',
  addressNumber: '',
  neighborhood: '',
  city: '',
  state: '',
  postalCode: '',
  latitude: null,
  longitude: null,
  coverImageUrl: '',
  active: true,
};

export function DashboardBusiness() {
  const { business, businesses, isLoading, refetch, selectBusiness } = useMyBusiness();
  const { request } = useGeolocation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<BusinessPayload>(empty);
  const [saving, setSaving] = useState(false);
  // Quando true, o formulário cria um NOVO negócio em vez de editar o selecionado.
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    if (creatingNew) {
      setForm(empty);
      return;
    }
    if (business) {
      setForm({
        name: business.name,
        category: business.category,
        description: business.description ?? '',
        phone: business.phone ?? '',
        whatsapp: business.whatsapp ?? '',
        address: business.address ?? '',
        addressNumber: business.addressNumber ?? '',
        neighborhood: business.neighborhood ?? '',
        city: business.city ?? '',
        state: business.state ?? '',
        postalCode: business.postalCode ?? '',
        latitude: business.latitude,
        longitude: business.longitude,
        coverImageUrl: business.coverImageUrl ?? '',
        active: business.active,
      });
    } else {
      setForm(empty);
    }
  }, [business, creatingNew]);

  const set = (patch: Partial<BusinessPayload>) => setForm((f) => ({ ...f, ...patch }));

  const useMyLocation = async () => {
    try {
      const c = await request();
      set({ latitude: c.latitude, longitude: c.longitude });
      toast.success('Localização definida!');
    } catch {
      toast.error('Não foi possível obter sua localização.');
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Informe o nome do negócio.');
    setSaving(true);
    try {
      if (business && !creatingNew) {
        await businessApi.update(business.id, form);
        toast.success('Negócio atualizado!');
        await refetch();
        queryClient.invalidateQueries({ queryKey: ['my-business'] });
      } else {
        const created = await businessApi.create(form);
        toast.success('Negócio criado! Agora adicione serviços e fotos.');
        await refetch();
        queryClient.invalidateQueries({ queryKey: ['my-business'] });
        setCreatingNew(false);
        selectBusiness(created.id);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <FullSpinner label="Carregando..." />;

  const editingExisting = Boolean(business) && !creatingNew;

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {editingExisting ? 'Meu negócio' : 'Cadastre seu negócio'}
          </h1>
          <p className="text-sm text-slate-500">Preencha as informações que aparecerão para os clientes.</p>
        </div>
        {businesses.length > 0 && (
          creatingNew ? (
            <button type="button" onClick={() => setCreatingNew(false)} className="btn-ghost">
              Cancelar novo
            </button>
          ) : (
            <button type="button" onClick={() => setCreatingNew(true)} className="btn-secondary">
              + Novo negócio
            </button>
          )
        )}
      </div>

      {/* Info */}
      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-slate-800">Informações</h2>
        <Field label="Nome do negócio" required>
          <input value={form.name} onChange={(e) => set({ name: e.target.value })} className="input" required />
        </Field>
        <Field label="Categoria">
          <select
            value={form.category}
            onChange={(e) => set({ category: e.target.value as BusinessCategory })}
            className="input"
          >
            <option value="HAIRDRESSER">💇 Cabeleireiro</option>
            <option value="BARBER">💈 Barbearia</option>
          </select>
        </Field>
        <Field label="Descrição">
          <textarea
            value={form.description ?? ''}
            onChange={(e) => set({ description: e.target.value })}
            rows={3}
            className="input resize-none"
            placeholder="Fale sobre o seu negócio..."
          />
        </Field>
        <Field label="Imagem de capa (URL)">
          <input value={form.coverImageUrl ?? ''} onChange={(e) => set({ coverImageUrl: e.target.value })} className="input" placeholder="https://..." />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone">
            <input value={form.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} className="input" placeholder="(11) 3000-0000" />
          </Field>
          <Field label="WhatsApp">
            <input value={form.whatsapp ?? ''} onChange={(e) => set({ whatsapp: e.target.value })} className="input" placeholder="5511999999999" />
          </Field>
        </div>
      </section>

      {/* Address */}
      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-slate-800">Endereço</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="CEP">
            <input value={form.postalCode ?? ''} onChange={(e) => set({ postalCode: e.target.value })} className="input" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Endereço">
              <input value={form.address ?? ''} onChange={(e) => set({ address: e.target.value })} className="input" />
            </Field>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Número">
            <input value={form.addressNumber ?? ''} onChange={(e) => set({ addressNumber: e.target.value })} className="input" />
          </Field>
          <Field label="Bairro">
            <input value={form.neighborhood ?? ''} onChange={(e) => set({ neighborhood: e.target.value })} className="input" />
          </Field>
          <Field label="Cidade">
            <input value={form.city ?? ''} onChange={(e) => set({ city: e.target.value })} className="input" />
          </Field>
        </div>
        <Field label="Estado">
          <input value={form.state ?? ''} onChange={(e) => set({ state: e.target.value })} className="input sm:w-40" placeholder="SP" />
        </Field>
      </section>

      {/* Location */}
      <section className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-slate-800">Localização no mapa <span className="text-sm font-normal text-slate-400">(opcional)</span></h2>
            <p className="text-xs text-slate-500">Não é obrigatório. Se informar, seu negócio aparece no mapa e com a distância até o cliente.</p>
          </div>
          <button type="button" onClick={useMyLocation} className="btn-secondary">
            <Navigation className="h-4 w-4" /> Usar minha localização
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-4 w-4" />
          {form.latitude && form.longitude
            ? `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`
            : 'Nenhuma localização definida (opcional). Toque no mapa ou use sua localização se quiser aparecer no mapa.'}
        </p>
        <LocationPicker
          latitude={form.latitude ?? null}
          longitude={form.longitude ?? null}
          onChange={(lat, lng) => set({ latitude: lat, longitude: lng })}
        />
      </section>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {business ? 'Salvar alterações' : 'Criar negócio'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
