import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type AppContent = { key: string; title: string; body: string };

export function useAppContent(key: string) {
  const [content, setContent] = useState<AppContent | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('app_content').select('*').eq('key', key).single();
    if (data) setContent(data as AppContent);
    setLoading(false);
  }, [key]);

  useEffect(() => { fetch(); }, [fetch]);

  return { content, loading, refetch: fetch };
}