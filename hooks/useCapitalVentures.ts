import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type CapexItem = { label: string; amount: number };

export type CapitalVenture = {
  id: string;
  title: string;
  summary: string;
  target_capital: number;
  capital_raised: number;
  capex_breakdown: CapexItem[];
  status: 'open' | 'funded' | 'closed';
  sort_order: number;
};

export function useCapitalVentures() {
  const [ventures, setVentures] = useState<CapitalVenture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('capital_ventures').select('*').order('sort_order');
    if (error) setError(error.message);
    else setVentures(data as CapitalVenture[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { ventures, loading, error, refetch: fetch };
}