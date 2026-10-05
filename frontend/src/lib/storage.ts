import { supabase, supabaseEnabled } from './supabase';

export const BUCKET = 'business-images';
export const storageEnabled = supabaseEnabled;

const MAX_SIZE_MB = 5;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

/** Uploads an image to Supabase Storage and returns its public URL. */
export async function uploadBusinessImage(businessId: number, file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase Storage não está configurado.');
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Formato inválido. Use JPG, PNG ou WEBP.');
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`A imagem deve ter no máximo ${MAX_SIZE_MB} MB.`);
  }
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${businessId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
