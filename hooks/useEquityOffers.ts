import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type EquityOffer = {
  id: string;
  title: string;
  price_per_share: number;
  min_shares: number;
  total_shares_available: number | null;
  dividend_note: string;
  description: string;
  sort_order: number;
};

export function useEquityOffers() {
  const [offers, setOffers] = useState<EquityOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('equity_offers').select('*').order('sort_order');
    if (error) setError(error.message);
    else setOffers(data as EquityOffer[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { offers, loading, error, refetch: fetch };
}