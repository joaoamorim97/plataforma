import { useRef, useState } from 'react';
import { Image as ImageIcon, Trash2, Star, Upload, Link2, Plus } from 'lucide-react';
import { useMyBusiness } from '@/hooks/useMyBusiness';
import { businessApi } from '@/lib/services';
import { uploadBusinessImage, storageEnabled } from '@/lib/storage';
import { useToast } from '@/components/ui/Toast';
import { FullSpinner, EmptyState, Spinner } from '@/components/ui/Feedback';
import { NoBusiness } from './NoBusiness';

export function DashboardPhotos() {
  const { business, isLoading, refetch } = useMyBusiness();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrl, setShowUrl] = useState(false);

  if (isLoading) return <FullSpinner />;
  if (!business) return <NoBusiness />;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBusinessImage(business.id, file);
      await businessApi.addPhoto(business.id, url, business.images.length === 0);
      toast.success('Foto adicionada!');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro no upload.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addByUrl = async () => {
    if (!urlInput.trim()) return;
    setUploading(true);
    try {
      await businessApi.addPhoto(business.id, urlInput.trim(), business.images.length === 0);
      toast.success('Foto adicionada!');
      setUrlInput('');
      setShowUrl(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar.');
    } finally {
      setUploading(false);
    }
  };

  const setCover = async (imageUrl: string) => {
    try {
      await businessApi.addPhoto(business.id, imageUrl, true);
      toast.success('Capa atualizada!');
      refetch();
    } catch {
      toast.error('Erro ao definir capa.');
    }
  };

  const remove = async (photoId: number) => {
    if (!confirm('Excluir esta foto?')) return;
    try {
      await businessApi.removePhoto(business.id, photoId);
      toast.success('Foto excluída.');
      refetch();
    } catch {
      toast.error('Erro ao excluir.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fotos</h1>
          <p className="text-sm text-slate-500">Capa e galeria do negócio (máx. 15 fotos)</p>
        </div>
        <div className="flex gap-2">
          {storageEnabled && (
            <>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">
                {uploading ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                Enviar foto
              </button>
            </>
          )}
          <button onClick={() => setShowUrl((v) => !v)} className="btn-secondary">
            <Link2 className="h-4 w-4" /> Por URL
          </button>
        </div>
      </div>

      {!storageEnabled && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
          Supabase Storage não configurado. Você ainda pode adicionar fotos por URL. Configure o Supabase e o bucket
          <code className="mx-1 rounded bg-amber-100 px-1">business-images</code> para enviar arquivos.
        </p>
      )}

      {showUrl && (
        <div className="card flex gap-2 p-4">
          <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://..." className="input" />
          <button onClick={addByUrl} disabled={uploading} className="btn-primary shrink-0">
            <Plus className="h-4 w-4" /> Adicionar
          </button>
        </div>
      )}

      {business.images.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Nenhuma foto" description="Adicione fotos para destacar seu negócio." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {business.images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-2xl">
              <img src={img.imageUrl} alt="" className="h-40 w-full object-cover" />
              {img.cover && (
                <span className="absolute left-2 top-2 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                  Capa
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
                {!img.cover && (
                  <button onClick={() => setCover(img.imageUrl)} className="rounded-full bg-white p-2 text-brand-600" title="Definir como capa">
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => remove(img.id)} className="rounded-full bg-white p-2 text-red-500" title="Excluir">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
