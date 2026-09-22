import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type CampaignMedia = {
  id: string;
  campaign_id: string;
  media_type: 'photo' | 'video';
  title: string;
  caption: string;
  storage_path: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  signedUrl?: string;
};

export function useEquityCampaignMedia(campaignId: string | undefined, includeUnpublished = false) {
  const [items, setItems] = useState<CampaignMedia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);

    let query = supabase.from('equity_campaign_media').select('*').eq('campaign_id', campaignId).order('sort_order');
    if (!includeUnpublished) query = query.eq('is_published', true);

    const { data } = await query;
    if (!data) { setItems([]); setLoading(false); return; }

    const withUrls = await Promise.all(
      data.map(async (item) => {
        const { data: signed } = await supabase.storage.from('equity-media').createSignedUrl(item.storage_path, 3600);
        return { ...item, signedUrl: signed?.signedUrl };
      })
    );

    setItems(withUrls as CampaignMedia[]);
    setLoading(false);
  }, [campaignId, includeUnpublished]);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, refetch: fetch };
}

export async function uploadCampaignMedia(params: {
  campaignId: string;
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  userId: string;
  mediaType: 'photo' | 'video';
}) {
  const extFromName = params.fileName?.split('.').pop()?.toLowerCase();
  const extFromMime = params.mimeType?.split('/')[1];
  const ext = (extFromName || extFromMime || (params.mediaType === 'video' ? 'mp4' : 'jpg')).replace('jpeg', 'jpg');
  const path = `${params.campaignId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const contentType = params.mimeType ?? (params.mediaType === 'video' ? 'video/mp4' : 'image/jpeg');

  const response = await fetch(params.uri);
  const arrayBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage.from('equity-media').upload(path, arrayBuffer, { contentType, upsert: false });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from('equity_campaign_media').insert({
    campaign_id: params.campaignId,
    media_type: params.mediaType,
    storage_path: path,
    mime_type: contentType,
    is_published: true,
    created_by: params.userId,
  });
  if (insertError) {
    await supabase.storage.from('equity-media').remove([path]);
    throw insertError;
  }
}

export async function updateCampaignMedia(id: string, patch: Partial<Pick<CampaignMedia, 'title' | 'caption' | 'is_published'>>) {
  const { error } = await supabase.from('equity_campaign_media').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCampaignMedia(item: CampaignMedia) {
  await supabase.storage.from('equity-media').remove([item.storage_path]);
  const { error } = await supabase.from('equity_campaign_media').delete().eq('id', item.id);
  if (error) throw error;
}