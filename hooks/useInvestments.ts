import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type InvestmentType = {
  id: string;
  title: string;
  subtitle: string;
  duration_label: string;
  icon: string;
  sort_order: number;
};

export type InvestmentPackage = {
  id: string;
  type_id: string;
  birds: number;
  amount: number;
  estimated_profit: number;
  profit_share_percent: number;
  duration: string;
  description: string;
  is_recommended: boolean;
  sort_order: number;
};

export function useInvestments() {
  const [types, setTypes] = useState<InvestmentType[]>([]);
  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [typesRes, packagesRes] = await Promise.all([
      supabase.from('investment_types').select('*').order('sort_order'),
      supabase.from('investment_packages').select('*').order('sort_order'),
    ]);

    if (typesRes.error) setError(typesRes.error.message);
    else setTypes(typesRes.data as InvestmentType[]);

    if (packagesRes.error) setError(packagesRes.error.message);
    else setPackages(packagesRes.data as InvestmentPackage[]);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { types, packages, loading, error, refetch: fetchAll };
}