import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';

export type FarmMedia = {
  id: string;
  media_type: 'photo' | 'video';
  title: string;
  caption: string;
  storage_path: string;
  public_url: string;
  mime_type: string | null;
  file_size: number | null;
  is_published: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
};

type Options = { includeUnpublished?: boolean };

export function useFarmMedia(options: Options = {}) {
  const includeUnpublished = options.includeUnpublished ?? false;
  const [items, setItems] = useState<FarmMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('farm_media').select('*').order('created_at', { ascending: false });
    if (!includeUnpublished) query = query.eq('is_published', true);

    const { data, error: fetchError } = await query;
    if (fetchError) setError(fetchError.message);
    else {
      setError(null);
      setItems((data ?? []) as FarmMedia[]);
    }
    setLoading(false);
  }, [includeUnpublished]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  return { items, loading, error, refetch: fetch };
}

export async function uploadFarmMediaFile(params: {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  userId: string;
  mediaType: 'photo' | 'video';
}) {
  const extFromName = params.fileName?.split('.').pop()?.toLowerCase();
  const extFromMime = params.mimeType?.split('/')[1];
  const ext = (extFromName || extFromMime || (params.mediaType === 'video' ? 'mp4' : 'jpg')).replace('jpeg', 'jpg');
  const path = `${params.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const contentType = params.mimeType ?? (params.mediaType === 'video' ? 'video/mp4' : 'image/jpeg');

  const response = await fetch(params.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage.from('farm-media').upload(path, arrayBuffer, {
    contentType,
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('farm-media').getPublicUrl(path);

  const { error: insertError } = await supabase.from('farm_media').insert({
    media_type: params.mediaType,
    title: '',
    caption: '',
    storage_path: path,
    public_url: data.publicUrl,
    mime_type: contentType,
    file_size: params.fileSize ?? arrayBuffer.byteLength,
    is_published: true,
    created_by: params.userId,
  });
  if (insertError) {
    await supabase.storage.from('farm-media').remove([path]);
    throw insertError;
  }
}

export async function updateFarmMedia(
  id: string,
  patch: Partial<Pick<FarmMedia, 'title' | 'caption' | 'is_published'>>,
) {
  const { error } = await supabase.from('farm_media').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteFarmMedia(item: FarmMedia) {
  const { error: storageError } = await supabase.storage.from('farm-media').remove([item.storage_path]);
  if (storageError) throw storageError;
  const { error } = await supabase.from('farm_media').delete().eq('id', item.id);
  if (error) throw error;
}
