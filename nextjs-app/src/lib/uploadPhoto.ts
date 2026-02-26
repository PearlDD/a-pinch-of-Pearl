import { supabase } from './supabase';

const BUCKET = 'recipe-photos';

export async function uploadPhoto(file: File): Promise<string> {
  // Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
