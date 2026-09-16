import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type OfficeSettings = { address: string; phone: string; email: string; hours: string };

export function useOfficeSettings() {
  const [settings, setSettings] = useState<OfficeSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('office_settings').select('*').eq('id', 1).single();
    if (data) setSettings(data as OfficeSettings);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { settings, loading, refetch: fetch };
}